import { supabaseAdmin } from '@/lib/supabase/admin';

const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

type CustomerRef = {
  name: string | null;
};

type JobRef = {
  name: string | null;
  job_number: string | null;
};

type ChangeOrderExportRow = {
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
  customers: CustomerRef | CustomerRef[] | null;
  jobs: JobRef | JobRef[] | null;
};

function firstRecord<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toCsvValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);

  if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toPlainNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : '';
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('change_orders')
    .select(
      'id, change_order_number, title, description, labor_cost, material_cost, other_cost, markup_percent, tax_percent, subtotal, markup_amount, tax_amount, total_amount, status, created_at, customers(name), jobs(name, job_number)'
    )
    .eq('company_id', DEMO_COMPANY_ID)
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json(
      {
        ok: false,
        message: 'Failed to export change orders',
        error: error.message,
      },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as ChangeOrderExportRow[];

  const header = [
    'Change Order Number',
    'Title',
    'Customer',
    'Job',
    'Job Number',
    'Status',
    'Labor Cost',
    'Material Cost',
    'Other Cost',
    'Subtotal',
    'Markup Percent',
    'Markup Amount',
    'Tax Percent',
    'Tax Amount',
    'Total Amount',
    'Created At',
    'Description',
  ];

  const csvLines = [header.map((column) => toCsvValue(column)).join(',')];

  for (const row of rows) {
    const customer = firstRecord(row.customers);
    const job = firstRecord(row.jobs);

    const line = [
      toCsvValue(row.change_order_number),
      toCsvValue(row.title),
      toCsvValue(customer?.name ?? ''),
      toCsvValue(job?.name ?? ''),
      toCsvValue(job?.job_number ?? ''),
      toCsvValue(row.status),
      toCsvValue(toPlainNumber(row.labor_cost)),
      toCsvValue(toPlainNumber(row.material_cost)),
      toCsvValue(toPlainNumber(row.other_cost)),
      toCsvValue(toPlainNumber(row.subtotal)),
      toCsvValue(toPlainNumber(row.markup_percent)),
      toCsvValue(toPlainNumber(row.markup_amount)),
      toCsvValue(toPlainNumber(row.tax_percent)),
      toCsvValue(toPlainNumber(row.tax_amount)),
      toCsvValue(toPlainNumber(row.total_amount)),
      toCsvValue(row.created_at),
      toCsvValue(row.description),
    ];

    csvLines.push(line.join(','));
  }

  const csv = csvLines.join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="change-orders-export.csv"',
    },
  });
}
