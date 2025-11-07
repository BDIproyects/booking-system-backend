// booking-system-backend/server.js
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;

app.use(express.json());

const allowedOrigins = ['http://127.0.0.1:5173', 'http://localhost:5173', 'https://[TU_VERCEL_APP_URL].vercel.app']; // <-- ¡Añade tu URL de Vercel aquí!
app.use(cors({
    origin: (origin, callback) => {
        // Permitir peticiones sin 'origin' (como apps móviles o CURL)
        if (!origin) return callback(null, true); 
        
        // Verificar si el origen está en la lista permitida
        if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
            return callback(null, true);
        } else {
            const msg = 'La política CORS no permite el acceso desde el origen especificado.';
            return callback(new Error(msg), false);
        }
    }
}));


// --- Configuración de Nodemailer (Transporte de Correo) ---
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});


// --- ENDPOINT PRINCIPAL: Enviar Confirmación ---
app.post('/api/send-confirmation', async (req, res) => {
    const { date, time, serviceName, clientEmail } = req.body;

    if (!date || !time || !serviceName || !clientEmail) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos para el correo.' });
    }

    const mailOptionsClient = {
        from: process.env.EMAIL_USER,
        to: clientEmail, 
        subject: `✅ Reserva Confirmada: ${serviceName}`,
        html: `
            <h1>¡Reserva Exitosa!</h1>
            <p>Hola,</p>
            <p>Tu cita ha sido confirmada:</p>
            <ul>
                <li><strong>Servicio:</strong> ${serviceName}</li>
                <li><strong>Fecha:</strong> ${date}</li>
                <li><strong>Hora:</strong> ${time}</li>
            </ul>
            <p>Gracias por tu reserva.</p>
        `
    };

    const mailOptionsPyme = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Se envía a la misma cuenta del negocio
        subject: `🔔 Nueva Reserva: ${serviceName} para ${clientEmail}`,
        html: `
            <h3>Nueva Reserva en Firestore</h3>
            <ul>
                <li><strong>Servicio:</strong> ${serviceName}</li>
                <li><strong>Fecha:</strong> ${date}</li>
                <li><strong>Hora:</strong> ${time}</li>
                <li><strong>Cliente Email:</strong> ${clientEmail}</li>
            </ul>
        `
    };

    try {
        await transporter.sendMail(mailOptionsClient);
        await transporter.sendMail(mailOptionsPyme);
        
        console.log(`Email enviado con éxito a ${clientEmail} y a la PyME.`);
        res.status(200).json({ success: true, message: 'Emails de confirmación enviados.' });

    } catch (error) {
        console.error('Error al enviar el email:', error.message);
        res.status(500).json({ success: false, message: 'Fallo el envío del correo de confirmación. Revisa las credenciales en Render.' });
    }
});


// 3. INICIAR EL SERVIDOR
app.listen(PORT, () => {
    console.log(`🚀 Servidor de emails corriendo en puerto ${PORT}`);
});