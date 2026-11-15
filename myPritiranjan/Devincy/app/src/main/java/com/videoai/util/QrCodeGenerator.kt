package com.videoai.util

import android.graphics.Bitmap
import android.graphics.Color
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.WriterException
import com.google.zxing.common.BitMatrix
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import com.videoai.mcp.auth.AuthManager

class QrCodeGenerator(private val authManager: AuthManager) {
    
    fun generateConnectionQrCode(size: Int = 512): Bitmap {
        val data = authManager.getQrCodeData()
        return generateQrCode(data, size)
    }
    
    fun generateQrCode(data: String, size: Int): Bitmap {
        val writer = QRCodeWriter()
        val hints = java.util.EnumMap(EncodeHintType::class.java)
        hints[EncodeHintType.ERROR_CORRECTION] = ErrorCorrectionLevel.M
        hints[EncodeHintType.MARGIN] = 2
        hints[EncodeHintType.CHARACTER_SET] = "UTF-8"
        
        var bitMatrix: BitMatrix
        try {
            bitMatrix = writer.encode(data, BarcodeFormat.QR_CODE, size, size, hints)
        } catch (e: WriterException) {
            throw RuntimeException("Failed to generate QR code", e)
        }
        
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val pixels = IntArray(size * size)
        
        for (y in 0 until size) {
            val offset = y * size
            for (x in 0 until size) {
                pixels[offset + x] = if (bitMatrix[x, y]) Color.BLACK else Color.WHITE
            }
        }
        
        bitmap.setPixels(pixels, 0, size, 0, 0, size, size)
        return bitmap
    }
    
    fun generateQrCodeWithLogo(data: String, size: Int, logo: Bitmap?): Bitmap {
        val qrBitmap = generateQrCode(data, size)
        
        logo?.let {
            val logoSize = size / 5
            val scaledLogo = Bitmap.createScaledBitmap(it, logoSize, logoSize, true)
            val canvas = android.graphics.Canvas(qrBitmap)
            val left = (size - logoSize) / 2
            val top = (size - logoSize) / 2
            canvas.drawBitmap(scaledLogo, left.toFloat(), top.toFloat(), null)
        }
        
        return qrBitmap
    }
}