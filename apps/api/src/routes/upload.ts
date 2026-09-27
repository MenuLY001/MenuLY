import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAdminAuth } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();
router.use(requireAdminAuth);

// Store file in memory, then upload to Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

/**
 * POST /api/admin/upload
 * Uploads an image to Supabase Storage bucket "Menu-Images".
 * Returns the public URL to store in Menu_Items.image_url.
 */
router.post('/', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.adminContext!;

  if (!req.file) {
    res.status(400).json({ error: 'No image file provided' });
    return;
  }

  const ext = req.file.mimetype.split('/')[1];
  const filename = `${restaurantId}/${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from('menu-images')
    .upload(filename, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (error) {
    res.status(500).json({ error: `Storage upload failed: ${error.message}` });
    return;
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('menu-images')
    .getPublicUrl(filename);

  res.json({ url: urlData.publicUrl });
});

export default router;
