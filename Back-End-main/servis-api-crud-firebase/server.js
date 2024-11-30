// /server.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path'; 
import configureCors from './middleware/cors.js'; // Import konfigurasi CORS
import bodyParser from 'body-parser';
import midtransClient from 'midtrans-client';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { checkRole } from './middleware/authMiddleware.js';
import transactionRoutes from './routes/transactionRoutes.js';
import { checkEmail } from './controllers/authController.js';
import authRoutes from './routes/authRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import checkAssetRoutes from './routes/checkAssetRoutes.js';
import loginController from './controllers/loginController.js';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();
const port = 3000;

// Menangani kesalahan (opsional, untuk penanganan kesalahan yang lebih baik)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.setHeader(
    "Permissions-Policy",
    "clipboard-read=(self), clipboard-write=(self)"
  );
  res.status(500).send("Something went wrong!");
  next();
});

app.use(express.json());
app.use(cors({ 
  origin: "http://localhost:5173",
  methods:['GET'],
  allowedHeaders: ['Content-Type'],
 }));

app.get('/proxy/download', async (req, res) => {
  const { fileUrl, size } = req.query;

  if (!fileUrl) {
    return res.status(400).json({ error: 'URL file tidak diberikan' });
  }

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Gagal mengambil file dari URL' });
    }

    const contentType = response.headers.get('content-type');
    const fileName = fileUrl.split('/').pop().split('?')[0];
    const fileBuffer = await response.buffer();

    console.log('File berhasil diambil dari URL:', fileUrl);
    console.log('Received size:', size);  

    // Jika file adalah gambar
    if (contentType.startsWith('image/')) {
      let processedImage = fileBuffer;

      switch (size) {
        case 'Original (6000x4000)': 
          processedImage = await sharp(fileBuffer).resize(6000, 4000).toBuffer();
          console.log('Image resized to Original (6000x4000)');
          break;

        case 'Large (1920x1280)':
          processedImage = await sharp(fileBuffer).resize(1920, 1280).toBuffer();
          console.log('Image resized to Large (1920x1280)');
          break;

        case 'Medium (1280x1280)':
          processedImage = await sharp(fileBuffer).resize(1280, 1280).toBuffer();
          console.log('Image resized to Medium (1280x1280)');
          break;

        case 'Small (640x427)':
          processedImage = await sharp(fileBuffer).resize(640, 427).toBuffer();
          console.log('Image resized to Small (640x427)');
          break;

        default:
          console.log('No matching size for image. Returning original.');
      }

      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(processedImage);
    } 
    // Jika file adalah video
    else if (contentType.startsWith('video/')) {
      const tempFilePath = path.resolve('./tempVideo.mp4');
      const tempOutputPath = path.resolve('./tempOutputVideo.mp4');
      fs.writeFileSync(tempFilePath, fileBuffer);

      let resolution = null;
      switch (size) {
        case 'SD (360x640)':
          resolution = '640x360';
          break;
        case 'SD (540x960)':
          resolution = '960x540';
          break;
        case 'HD (720x1280)':
          resolution = '1280x720';
          break;
        case 'Full HD (1080x1920)':
          resolution = '1920x1080';
          break;
        case 'Quad HD (1440x2560)':
          resolution = '2560x1440';
          break;
        case '4K UHD (2160x3840)':
          resolution = '3840x2160';
          break;
        default:
          console.log('No video size manipulation.');
      }

      const ffmpegProcess = ffmpeg(tempFilePath);
      if (resolution) {
        ffmpegProcess.outputOptions(['-vf', `scale=${resolution.split('x').join(':')}`]);
      }

      console.log('Processing video with resolution:', resolution || 'Original');

      ffmpegProcess
        .output(tempOutputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg command line:', commandLine);
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err.message);
          fs.unlinkSync(tempFilePath);
          if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
          return res.status(500).json({ error: 'Kesalahan saat memproses video', message: err.message });
        })
        .on('end', () => {
          console.log('FFmpeg selesai memproses video.');
          res.setHeader('Content-Type', contentType || 'application/octet-stream');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

          res.sendFile(tempOutputPath, {}, (err) => {
            fs.unlinkSync(tempFilePath);
            fs.unlinkSync(tempOutputPath);
            if (err) console.error('Error sending file:', err);
          });
        })
        .run();
    } 
   
    else {
      console.log('File bukan gambar atau video. Mengirimkan file asli.');
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(fileBuffer);
    }
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memproses permintaan', message: error.message });
  }
});

// Gunakan rute
app.use("/api/users", userRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", authRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/checkAsset", checkAssetRoutes);
app.post("/api/logins", loginController);

// Menangani kesalahan (opsional, untuk penanganan kesalahan yang lebih baik)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
