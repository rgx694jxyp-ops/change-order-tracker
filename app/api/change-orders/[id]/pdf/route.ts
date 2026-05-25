import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';

import { supabaseAdmin } from '@/lib/supabase/admin';

const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

type CustomerInfo = {
  name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
};

type JobInfo = {
  name: string | null;
  job_number: string | null;
  address: string | null;
};

type ChangeOrderPdfData = {
  id: string;
  change_order_number: string | null;
  title: string;
  description: string | null;
  labor_cost: number | string | null;
  material_cost: number | string | null;
  other_cost: number | string | null;
  markup_percent: number | string | null;
  tax_percent: number | string | null;
  subtotal: number | string | null;
  markup_amount: number | string | null;
  tax_amount: number | string | null;
  total_amount: number | string | null;
  status: string;
  created_at: string;
  customers: CustomerInfo | null;
  jobs: JobInfo | null;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number | string | null | undefined) {
  return usdFormatter.format(toNumber(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Unknown';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown';
  }

  return parsed.toLocaleString('en-US');
}

function safeText(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : 'N/A';
}

function sanitizeFilenamePart(value: string) {
  const safe = value.replace(/[^A-Za-z0-9_-]/g, '_');
  return safe.length > 0 ? safe : 'change-order';
}

function drawWrappedText(options: {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  lineHeight: number;
  font: PDFFont;
  size: number;
  color: ReturnType<typeof rgb>;
  draw: (line: string, x: number, y: number) => void;
}) {
  const words = options.text.split(/\s+/).filter(Boolean);
  let line = '';
  let y = options.y;

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    const width = options.font.widthOfTextAtSize(nextLine, options.size);

    if (width <= options.maxWidth) {
      line = nextLine;
      continue;
    }

    if (line) {
      options.draw(line, options.x, y);
      y -= options.lineHeight;
    }

    line = word;
  }

  if (line) {
    options.draw(line, options.x, y);
    y -= options.lineHeight;
  }

  return y;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const { data, error } = await supabaseAdmin
    .from('change_orders')
    .select(
      'id, change_order_number, title, description, labor_cost, material_cost, other_cost, markup_percent, tax_percent, subtotal, markup_amount, tax_amount, total_amount, status, created_at, customers(name, contact_name, email, phone, billing_address), jobs(name, job_number, address)'
    )
    .eq('id', id)
    .eq('company_id', DEMO_COMPANY_ID)
    .maybeSingle();

  if (error) {
    return Response.json(
      {
        ok: false,
        message: 'Failed to load change order',
        error: error.message,
      },
      { status: 500 }
    );
  }

  if (!data) {
    return Response.json(
      {
        ok: false,
        message: 'Change order not found',
      },
      { status: 404 }
    );
  }

  const changeOrder = data as ChangeOrderPdfData;
  const customer = changeOrder.customers;
  const job = changeOrder.jobs;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  const contentWidth = width - margin * 2;
  let cursorY = height - margin;

  function drawLabelValue(label: string, value: string) {
    page.drawText(`${label}: ${value}`, {
      x: margin,
      y: cursorY,
      size: 11,
      font: helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });
    cursorY -= 16;
  }

  page.drawText('Change Order', {
    x: margin,
    y: cursorY,
    size: 26,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  cursorY -= 30;

  page.drawText('Demo Contractor', {
    x: margin,
    y: cursorY,
    size: 12,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });
  cursorY -= 24;

  drawLabelValue('Change Order Number', safeText(changeOrder.change_order_number));
  drawLabelValue('Title', safeText(changeOrder.title));
  drawLabelValue('Status', safeText(changeOrder.status));
  drawLabelValue('Created', formatDateTime(changeOrder.created_at));
  cursorY -= 8;

  page.drawText('Customer Information', {
    x: margin,
    y: cursorY,
    size: 13,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  cursorY -= 18;

  drawLabelValue('Name', safeText(customer?.name));
  drawLabelValue('Contact', safeText(customer?.contact_name));
  drawLabelValue('Email', safeText(customer?.email));
  drawLabelValue('Phone', safeText(customer?.phone));
  drawLabelValue('Billing Address', safeText(customer?.billing_address));
  cursorY -= 8;

  page.drawText('Job Information', {
    x: margin,
    y: cursorY,
    size: 13,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  cursorY -= 18;

  drawLabelValue('Job Name', safeText(job?.name));
  drawLabelValue('Job Number', safeText(job?.job_number));
  drawLabelValue('Job Address', safeText(job?.address));
  cursorY -= 8;

  page.drawText('Description', {
    x: margin,
    y: cursorY,
    size: 13,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  cursorY -= 16;

  cursorY = drawWrappedText({
    text: safeText(changeOrder.description),
    x: margin,
    y: cursorY,
    maxWidth: contentWidth,
    lineHeight: 14,
    font: helvetica,
    size: 11,
    color: rgb(0.1, 0.1, 0.1),
    draw: (line, x, y) => {
      page.drawText(line, {
        x,
        y,
        size: 11,
        font: helvetica,
        color: rgb(0.1, 0.1, 0.1),
      });
    },
  });

  cursorY -= 8;

  page.drawText('Cost Breakdown', {
    x: margin,
    y: cursorY,
    size: 13,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  cursorY -= 18;

  drawLabelValue('Labor', formatMoney(changeOrder.labor_cost));
  drawLabelValue('Materials', formatMoney(changeOrder.material_cost));
  drawLabelValue('Other', formatMoney(changeOrder.other_cost));
  drawLabelValue('Subtotal', formatMoney(changeOrder.subtotal));
  drawLabelValue('Markup %', `${toNumber(changeOrder.markup_percent).toFixed(2)}%`);
  drawLabelValue('Markup Amount', formatMoney(changeOrder.markup_amount));
  drawLabelValue('Tax %', `${toNumber(changeOrder.tax_percent).toFixed(2)}%`);
  drawLabelValue('Tax Amount', formatMoney(changeOrder.tax_amount));

  page.drawText(`Total: ${formatMoney(changeOrder.total_amount)}`, {
    x: margin,
    y: cursorY,
    size: 13,
    font: helveticaBold,
    color: rgb(0.05, 0.05, 0.05),
  });

  const pdfBytes = await pdfDoc.save();
  const filePart = sanitizeFilenamePart(changeOrder.change_order_number || changeOrder.id);
  const fileName = `change-order-${filePart}.pdf`;

  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
    },
  });
}
