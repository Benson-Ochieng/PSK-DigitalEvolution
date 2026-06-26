import fs from "fs";
import path from "path";
import { query } from "~/db.server";

export interface MediaItem {
  id?: string;
  name: string;
  url: string;
  size: number;
  date: string;
  mimeType: string;
  folder: string;
  fullPath: string;
}

export async function syncMediaAssets() {
  const ASSETS_DIR = path.join(process.cwd(), "public", "assets");
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".mp4", ".webm", ".mov", ".ogg", ".pdf", ".mp3", ".wav"];
  const filesOnDisk: {
    name: string;
    url: string;
    size: number;
    mime_type: string;
    folder: string;
    full_path: string;
  }[] = [];

  function scanDirectory(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          // Calculate public URL
          const publicIndex = filePath.indexOf(path.join("public"));
          let url = "";
          if (publicIndex !== -1) {
            url = filePath.substring(publicIndex + "public".length).replace(/\\/g, "/");
          } else {
            url = "/assets/" + path.relative(ASSETS_DIR, filePath).replace(/\\/g, "/");
          }

          // Calculate folder path relative to assets
          const assetsIndex = filePath.indexOf(path.join("public", "assets"));
          let folder = "root";
          if (assetsIndex !== -1) {
            const relativeToAssets = filePath.substring(assetsIndex + path.join("public", "assets").length);
            const dirName = path.dirname(relativeToAssets).replace(/\\/g, "/");
            folder = dirName === "/" || dirName === "." ? "root" : dirName.replace(/^\//, "");
          }

          let mime_type = "application/octet-stream";
          if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) mime_type = `image/${ext.replace(".", "")}`;
          else if (ext === ".svg") mime_type = "image/svg+xml";
          else if ([".mp4", ".webm", ".mov", ".ogg"].includes(ext)) mime_type = `video/${ext.replace(".", "")}`;
          else if (ext === ".pdf") mime_type = "application/pdf";
          else if ([".mp3", ".wav"].includes(ext)) mime_type = `audio/${ext.replace(".", "")}`;

          filesOnDisk.push({
            name: file,
            url,
            size: stat.size,
            mime_type,
            folder,
            full_path: filePath,
          });
        }
      }
    }
  }

  scanDirectory(ASSETS_DIR);

  // 1. Fetch all paths and sizes from DB to check for orphaned records and filter unchanged files
  const { rows: dbAssets } = await query(`SELECT full_path, size FROM media_assets`);
  const dbAssetMap = new Map<string, number>(dbAssets.map(r => [r.full_path, Number(r.size)]));

  const newOrChangedFiles = filesOnDisk.filter(file => {
    const dbSize = dbAssetMap.get(file.full_path);
    return dbSize === undefined || dbSize !== file.size;
  });

  // 2. Only insert/update files on disk that have actually changed or are new
  if (newOrChangedFiles.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < newOrChangedFiles.length; i += chunkSize) {
      const chunk = newOrChangedFiles.slice(i, i + chunkSize);
      const chunkPlaceholders: string[] = [];
      const chunkParams: any[] = [];
      
      chunk.forEach((file, index) => {
        const baseIndex = index * 6;
        chunkPlaceholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`);
        chunkParams.push(file.name, file.url, file.size, file.mime_type, file.folder, file.full_path);
      });

      await query(`
        INSERT INTO media_assets (name, url, size, mime_type, folder, full_path)
        VALUES ${chunkPlaceholders.join(", ")}
        ON CONFLICT (full_path) DO UPDATE SET
          name = EXCLUDED.name,
          url = EXCLUDED.url,
          size = EXCLUDED.size,
          mime_type = EXCLUDED.mime_type,
          folder = EXCLUDED.folder
      `, chunkParams);
    }
    console.log(`Synced ${newOrChangedFiles.length} new/changed media assets to database.`);
  }

  // 3. Check for orphaned records (files in DB that are no longer on disk)
  const diskPaths = new Set(filesOnDisk.map(f => f.full_path));
  const orphanedPaths: string[] = [];

  for (const dbAsset of dbAssets) {
    if (!diskPaths.has(dbAsset.full_path)) {
      orphanedPaths.push(dbAsset.full_path);
    }
  }

  if (orphanedPaths.length > 0) {
    await query(`
      DELETE FROM media_assets 
      WHERE full_path = ANY($1)
    `, [orphanedPaths]);
    console.log(`Deleted ${orphanedPaths.length} orphaned media assets from database.`);
  }

  // 3. Align products.media_asset_id with media_assets.id based on URL matches
  try {
    await query(`
      UPDATE products p
      SET media_asset_id = ma.id
      FROM media_assets ma
      WHERE p.media_asset_id IS NULL 
        AND (p.image_url = ma.url OR p.image_url = '/' || ma.url OR p.image_url = ma.full_path)
    `);
  } catch (e) {
    console.error("Failed to align products.media_asset_id in syncMediaAssets:", e);
  }
}

export async function getMediaAssets(): Promise<MediaItem[]> {
  const { rows } = await query(`
    SELECT id, name, url, size, mime_type as "mimeType", folder, full_path as "fullPath", created_at
    FROM media_assets
    ORDER BY created_at DESC
  `);
  
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    url: r.url,
    size: Number(r.size),
    date: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    mimeType: r.mimeType,
    folder: r.folder,
    fullPath: r.fullPath,
  }));
}
