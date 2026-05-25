import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase/admin';

const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const ATTACHMENTS_BUCKET = 'change-order-attachments';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type RouteContext = {
  params: Promise<{ id: string }>;
};

function sanitizeFileName(fileName: string) {
  const normalized = fileName.replace(/\s+/g, '-').replace(/[^A-Za-z0-9._-]/g, '_');
  return normalized.length > 0 ? normalized : 'attachment';
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const { data, error } = await supabaseAdmin
    .from('attachments')
    .select(
      'id, file_name, file_type, file_size_bytes, storage_bucket, storage_path, public_url, uploaded_by, created_at'
    )
    .eq('company_id', DEMO_COMPANY_ID)
    .eq('change_order_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load attachments',
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, attachments: data });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const formData = await request.formData();
  const fileField = formData.get('file');

  if (!fileField || typeof fileField === 'string') {
    return NextResponse.json(
      {
        ok: false,
        message: 'File is required',
      },
      { status: 400 }
    );
  }

  const file = fileField as File;

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        message: 'File must be 10 MB or less',
      },
      { status: 400 }
    );
  }

  const { data: existingChangeOrder, error: lookupError } = await supabaseAdmin
    .from('change_orders')
    .select('id')
    .eq('id', id)
    .eq('company_id', DEMO_COMPANY_ID)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load change order',
        error: lookupError.message,
      },
      { status: 500 }
    );
  }

  if (!existingChangeOrder) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Change order not found',
      },
      { status: 404 }
    );
  }

  const safeFileName = sanitizeFileName(file.name || 'attachment');
  const storagePath = `${DEMO_COMPANY_ID}/${id}/${crypto.randomUUID()}-${safeFileName}`;

  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: file.type || 'application/octet-stream',
    });

  if (uploadError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to upload attachment',
        error: uploadError.message,
      },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(storagePath);

  const { data: attachment, error: insertError } = await supabaseAdmin
    .from('attachments')
    .insert({
      company_id: DEMO_COMPANY_ID,
      change_order_id: id,
      file_name: file.name || safeFileName,
      file_type: file.type || null,
      file_size_bytes: file.size,
      storage_bucket: ATTACHMENTS_BUCKET,
      storage_path: storagePath,
      public_url: publicUrl,
      uploaded_by: 'demo-user',
    })
    .select('*')
    .single();

  if (insertError) {
    await supabaseAdmin.storage.from(ATTACHMENTS_BUCKET).remove([storagePath]);

    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to save attachment metadata',
        error: insertError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, attachment });
}
