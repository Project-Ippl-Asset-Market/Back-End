import fetch from "node-fetch";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
process.removeAllListeners("warning");

export const downloadAndProcessFile = async (req, res) => {
  const { fileUrl, size } = req.query;

  if (!fileUrl) {
    return res.status(400).json({ error: "URL file tidak diberikan" });
  }

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Gagal mengambil file dari URL" });
    }

    const contentType = response.headers.get("content-type");
    const fileName = fileUrl.split("/").pop().split("?")[0];
    const fileBuffer = await response.buffer();

    let fileExtension = "";
    if (contentType.startsWith("image/")) {
      fileExtension = contentType.split("/")[1];
    } else if (contentType.startsWith("video/")) {
      fileExtension = "mp4";
    }

    if (contentType.startsWith("image/")) {
      let processedImage = fileBuffer;

      switch (size) {
        case "Original (6000x4000)":
          processedImage = await sharp(fileBuffer)
            .resize(6000, 4000)
            .toBuffer();
          break;

        case "Large (1920x1280)":
          processedImage = await sharp(fileBuffer)
            .resize(1920, 1280)
            .toBuffer();
          break;

        case "Medium (1280x1280)":
          processedImage = await sharp(fileBuffer)
            .resize(1280, 1280)
            .toBuffer();
          break;

        case "Small (640x427)":
          processedImage = await sharp(fileBuffer).resize(640, 427).toBuffer();
          break;

        default:
          console.log("No matching size for image. Returning original.");
      }

      res.setHeader("Content-Type", contentType || "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}.${fileExtension}"`
      );
      return res.send(processedImage);
    } else if (contentType.startsWith("video/")) {
      const localPath = path.resolve("./localVideo.mp4");
      fs.writeFileSync(localPath, fileBuffer);

      let resolution = null;
      switch (size) {
        case "SD (360x640)":
          resolution = "640x360";
          break;
        case "SD (540x960)":
          resolution = "960x540";
          break;
        case "HD (720x1280)":
          resolution = "1280x720";
          break;
        case "Full HD (1080x1920)":
          resolution = "1920x1080";
          break;
        case "Quad HD (1440x2560)":
          resolution = "2560x1440";
          break;
        case "4K UHD (2160x3840)":
          resolution = "3840x2160";
          break;
        default:
          console.log("No video size manipulation.");
      }

      const localOutputPath = path.resolve("./localOutput.mp4");
      const ffmpegProcess = ffmpeg(localPath);
      if (resolution) {
        ffmpegProcess.outputOptions([
          `-vf`,
          `scale=${resolution.split("x").join(":")}`,
        ]);
      }

      ffmpegProcess
        .output(localOutputPath)
        .on("start", () => {})
        .on("error", (err) => {
          console.error("FFmpeg error:", err.message);
          fs.unlinkSync(localPath);
          if (fs.existsSync(localOutputPath)) fs.unlinkSync(localOutputPath);
          return res.status(500).json({
            error: "Kesalahan saat memproses video",
            message: err.message,
          });
        })
        .on("end", () => {
          res.setHeader(
            "Content-Type",
            contentType || "application/octet-stream"
          );
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}.${fileExtension}"`
          );

          res.sendFile(localOutputPath, {}, (err) => {
            fs.unlinkSync(localPath);
            fs.unlinkSync(localOutputPath);
            if (err) console.error("Error sending file:", err);
          });
        })
        .run();
    } else {
      res.setHeader("Content-Type", contentType || "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}.${fileExtension}"`
      );
      return res.send(fileBuffer);
    }
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      error: "Terjadi kesalahan saat memproses permintaan",
      message: error.message,
    });
  }
};
