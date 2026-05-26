import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';

import { getCurrentCompanyContext } from '@/lib/auth/current-company';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

type CompanyInfo = {
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  billing_email: string | null;
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
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function safeText(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : '—';
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
  const result = await getCurrentCompanyContext();

  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        message: result.message,
        ...(result.error ? { error: result.error } : {}),
      },
      { status: result.status }
    );
  }

  const { companyId } = result.context;
  const { id } = await context.params;

  const { data, error } = await supabaseAdmin
    .from('change_orders')
    .select(
      'id, change_order_number, title, description, labor_cost, material_cost, other_cost, markup_percent, tax_percent, subtotal, markup_amount, tax_amount, total_amount, status, created_at, customers(name, contact_name, email, phone, billing_address), jobs(name, job_number, address)'
    )
    .eq('id', id)
    .eq('company_id', companyId)
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

  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .select('name, phone, email, address, billing_email')
    .eq('id', companyId)
    .maybeSingle();

  if (companyError) {
    return Response.json(
      {
        ok: false,
        message: 'Failed to load company details',
        error: companyError.message,
      },
      { status: 500 }
    );
  }

  if (!company) {
    return Response.json(
      {
        ok: false,
        message: 'Company not found',
      },
      { status: 404 }
    );
  }

  const changeOrder = data as ChangeOrderPdfData;
  const companyInfo = company as CompanyInfo;
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

  function drawTextLine(text: string, x: number, y: number, isBold = false, size = 11) {
    page.drawText(text, {
      x,
      y,
      size,
      font: isBold ? helveticaBold : helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  function drawLabelValue(label: string, value: string, x = margin, y = cursorY) {
    page.drawText(label, {
      x,
      y,
      size: 10,
      font: helveticaBold,
      color: rgb(0.35, 0.35, 0.35),
    });

    page.drawText(value, {
      x,
      y: y - 12,
      size: 11,
      font: helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  function drawSectionTitle(title: string) {
    page.drawText(title, {
      x: margin,
      y: cursorY,
      size: 12,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    cursorY -= 8;
    page.drawLine({
      start: { x: margin, y: cursorY },
      end: { x: width - margin, y: cursorY },
      thickness: 0.8,
      color: rgb(0.82, 0.82, 0.82),
    });
    cursorY -= 16;
  }

  function drawCostRow(label: string, value: string, isTotal = false) {
    const rowHeight = 20;
    const rowTop = cursorY;

    if (isTotal) {
      page.drawRectangle({
        x: margin,
        y: rowTop - rowHeight + 4,
        width: contentWidth,
        height: rowHeight,
        color: rgb(0.93, 0.95, 1),
      });
    }

    page.drawText(label, {
      x: margin,
      y: rowTop - 10,
      size: isTotal ? 12 : 11,
      font: isTotal ? helveticaBold : helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });

    const valueWidth = (isTotal ? helveticaBold : helvetica).widthOfTextAtSize(
      value,
      isTotal ? 12 : 11
    );
    page.drawText(value, {
      x: width - margin - valueWidth,
      y: rowTop - 10,
      size: isTotal ? 12 : 11,
      font: isTotal ? helveticaBold : helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });

    cursorY -= rowHeight;

    if (!isTotal) {
      page.drawLine({
        start: { x: margin, y: cursorY + 4 },
        end: { x: width - margin, y: cursorY + 4 },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.9),
      });
    }
  }

  drawTextLine('CHANGE ORDER', margin, cursorY, true, 26);
  cursorY -= 30;

  drawTextLine(safeText(companyInfo.name), margin, cursorY, true, 12);
  cursorY -= 16;

  if (safeText(companyInfo.address) !== '—') {
    drawTextLine(safeText(companyInfo.address), margin, cursorY);
    cursorY -= 14;
  }

  const headerContactParts = [safeText(companyInfo.phone), safeText(companyInfo.email)].filter(
    (part) => part !== '—'
  );
  if (headerContactParts.length > 0) {
    drawTextLine(headerContactParts.join(' | '), margin, cursorY);
    cursorY -= 16;
  }

  cursorY -= 6;

  drawSectionTitle('Metadata');
  drawLabelValue('Change Order #', safeText(changeOrder.change_order_number));
  drawLabelValue('Status', safeText(changeOrder.status), margin + contentWidth / 2, cursorY);
  cursorY -= 28;
  drawLabelValue('Created date', formatDateTime(changeOrder.created_at));
  cursorY -= 30;

  drawSectionTitle('Customer and Job');
  drawLabelValue('Customer name', safeText(customer?.name));
  drawLabelValue('Job name', safeText(job?.name), margin + contentWidth / 2, cursorY);
  cursorY -= 28;
  drawLabelValue('Job address', safeText(job?.address));
  cursorY -= 28;

  drawSectionTitle('Change Details');
  drawLabelValue('Title', safeText(changeOrder.title));
  cursorY -= 28;

  page.drawText('Description', {
    x: margin,
    y: cursorY,
    size: 10,
    font: helveticaBold,
    color: rgb(0.35, 0.35, 0.35),
  });
  cursorY -= 14;

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

  drawSectionTitle('Cost Breakdown');
  drawCostRow('Labor', formatMoney(changeOrder.labor_cost));
  drawCostRow('Materials', formatMoney(changeOrder.material_cost));
  drawCostRow('Other', formatMoney(changeOrder.other_cost));
  drawCostRow('Subtotal', formatMoney(changeOrder.subtotal));
  drawCostRow('Markup %', `${toNumber(changeOrder.markup_percent).toFixed(2)}%`);
  drawCostRow('Markup Amount', formatMoney(changeOrder.markup_amount));
  drawCostRow('Tax %', `${toNumber(changeOrder.tax_percent).toFixed(2)}%`);
  drawCostRow('Tax Amount', formatMoney(changeOrder.tax_amount));
  drawCostRow('Total', formatMoney(changeOrder.total_amount), true);

  const footerY = 40;
  page.drawLine({
    start: { x: margin, y: footerY + 14 },
    end: { x: width - margin, y: footerY + 14 },
    thickness: 0.8,
    color: rgb(0.82, 0.82, 0.82),
  });

  page.drawText(
    'This change order is valid only when approved by the customer or authorized representative.',
    {
      x: margin,
      y: footerY,
      size: 11,
      font: helvetica,
      color: rgb(0.32, 0.32, 0.32),
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
