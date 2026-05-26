import { NextResponse } from 'next/server';

import { getCurrentCompanyContext } from '@/lib/auth/current-company';
import { supabaseAdmin } from '@/lib/supabase/admin';

const COMPANY_SETTINGS_SELECT =
  'id, name, phone, email, address, billing_email, default_markup_percent, default_tax_percent, timezone, plan, subscription_status, created_at, updated_at';

type PatchBody = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  address?: unknown;
  billing_email?: unknown;
  default_markup_percent?: unknown;
  default_tax_percent?: unknown;
  timezone?: unknown;
};

function badRequest(message: string) {
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    { status: 400 }
  );
}

function normalizeOptionalStringField(value: unknown, fieldLabel: string) {
  if (value === null) {
    return { ok: true as const, value: null };
  }

  if (typeof value !== 'string') {
    return {
      ok: false as const,
      response: badRequest(`${fieldLabel} must be a string`),
    };
  }

  const trimmed = value.trim();
  return { ok: true as const, value: trimmed.length > 0 ? trimmed : null };
}

function normalizePercentField(value: unknown, fieldLabel: string) {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return {
      ok: false as const,
      response: badRequest(`${fieldLabel} must be a number between 0 and 100`),
    };
  }

  if (value < 0 || value > 100) {
    return {
      ok: false as const,
      response: badRequest(`${fieldLabel} must be a number between 0 and 100`),
    };
  }

  return { ok: true as const, value };
}

export async function GET() {
  const result = await getCurrentCompanyContext();

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: result.message,
        ...(result.error ? { error: result.error } : {}),
      },
      { status: result.status }
    );
  }

  const { companyId } = result.context;

  const { data: company, error } = await supabaseAdmin
    .from('companies')
    .select(COMPANY_SETTINGS_SELECT)
    .eq('id', companyId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load company settings',
        error: error.message,
      },
      { status: 500 }
    );
  }

  if (!company) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Company not found',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, company });
}

export async function PATCH(request: Request) {
  const result = await getCurrentCompanyContext();

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: result.message,
        ...(result.error ? { error: result.error } : {}),
      },
      { status: result.status }
    );
  }

  let body: PatchBody;

  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return badRequest('Request body must be valid JSON');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return badRequest('Request body must be a JSON object');
  }

  const updatePayload: Record<string, unknown> = {};
  let hasAcceptedField = false;

  if ('name' in body) {
    hasAcceptedField = true;

    if (typeof body.name !== 'string') {
      return badRequest('Name must be a string');
    }

    const trimmedName = body.name.trim();
    if (!trimmedName) {
      return badRequest('Name must not be blank');
    }

    updatePayload.name = trimmedName;
  }

  if ('phone' in body) {
    hasAcceptedField = true;
    const normalized = normalizeOptionalStringField(body.phone, 'Phone');
    if (!normalized.ok) {
      return normalized.response;
    }
    updatePayload.phone = normalized.value;
  }

  if ('email' in body) {
    hasAcceptedField = true;
    const normalized = normalizeOptionalStringField(body.email, 'Email');
    if (!normalized.ok) {
      return normalized.response;
    }
    updatePayload.email = normalized.value;
  }

  if ('address' in body) {
    hasAcceptedField = true;
    const normalized = normalizeOptionalStringField(body.address, 'Address');
    if (!normalized.ok) {
      return normalized.response;
    }
    updatePayload.address = normalized.value;
  }

  if ('billing_email' in body) {
    hasAcceptedField = true;
    const normalized = normalizeOptionalStringField(body.billing_email, 'Billing email');
    if (!normalized.ok) {
      return normalized.response;
    }
    updatePayload.billing_email = normalized.value;
  }

  if ('default_markup_percent' in body) {
    hasAcceptedField = true;
    const normalized = normalizePercentField(body.default_markup_percent, 'Default markup percent');
    if (!normalized.ok) {
      return normalized.response;
    }
    updatePayload.default_markup_percent = normalized.value;
  }

  if ('default_tax_percent' in body) {
    hasAcceptedField = true;
    const normalized = normalizePercentField(body.default_tax_percent, 'Default tax percent');
    if (!normalized.ok) {
      return normalized.response;
    }
    updatePayload.default_tax_percent = normalized.value;
  }

  if ('timezone' in body) {
    hasAcceptedField = true;

    if (typeof body.timezone !== 'string') {
      return badRequest('Timezone must be a non-empty string');
    }

    const trimmedTimezone = body.timezone.trim();
    if (!trimmedTimezone) {
      return badRequest('Timezone must be a non-empty string');
    }

    updatePayload.timezone = trimmedTimezone;
  }

  if (!hasAcceptedField) {
    return badRequest('No accepted fields provided for update');
  }

  updatePayload.updated_at = new Date().toISOString();

  const { companyId } = result.context;
  const { data: company, error } = await supabaseAdmin
    .from('companies')
    .update(updatePayload)
    .eq('id', companyId)
    .select(COMPANY_SETTINGS_SELECT)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to update company settings',
        error: error.message,
      },
      { status: 500 }
    );
  }

  if (!company) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Company not found',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Company settings updated',
    company,
  });
}
