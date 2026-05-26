import { NextResponse } from 'next/server';

import { getCurrentCompanyContext } from '@/lib/auth/current-company';
import { supabaseAdmin } from '@/lib/supabase/admin';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isNotFoundError(error: { code?: string; details?: string | null; message: string }) {
  return (
    error.code === 'PGRST116' ||
    error.details?.includes('0 rows') ||
    error.message.toLowerCase().includes('0 rows')
  );
}

export async function POST(_request: Request, context: RouteContext) {
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

  const { id } = await context.params;

  const { data: attachment, error: attachmentError } = await supabaseAdmin
    .from('attachments')
    .select('id, company_id, change_order_id, file_name, storage_bucket, storage_path')
    .eq('id', id)
    .eq('company_id', result.context.companyId)
    .single();

  if (attachmentError) {
    if (isNotFoundError(attachmentError)) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Attachment not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load attachment',
        error: attachmentError.message,
      },
      { status: 500 }
    );
  }

  const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
    .from(attachment.storage_bucket)
    .createSignedUrl(attachment.storage_path, 300);

  if (signedUrlError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to create signed URL',
        error: signedUrlError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    signed_url: signedUrlData.signedUrl,
    expires_in: 300,
    attachment: {
      id: attachment.id,
      file_name: attachment.file_name,
      change_order_id: attachment.change_order_id,
    },
  });
}
