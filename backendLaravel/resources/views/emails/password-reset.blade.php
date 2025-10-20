<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #333;
            margin: 0;
            font-size: 24px;
        }
        .content {
            color: #555;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .reset-button {
            text-align: center;
            margin: 30px 0;
        }
        .reset-button a {
            background-color: #007bff;
            color: white !important;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            display: inline-block;
        }
        .reset-button a:hover {
            background-color: #0056b3;
        }
        .token-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #007bff;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #888;
            font-size: 12px;
            text-align: center;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
        </div>
        
        <div class="content">
            <p>Hola <strong>{{ $user->name }}</strong>,</p>
            
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>EPS API</strong>.</p>
            
            <p>Si no solicitaste este cambio, puedes ignorar este correo electrónico. Tu contraseña permanecerá sin cambios.</p>
        </div>

        <div class="token-info">
            <h3>🔑 Tu código de recuperación:</h3>
            <p style="font-size: 18px; font-weight: bold; color: #007bff; text-align: center; letter-spacing: 2px; margin: 10px 0;">
                {{ $token }}
            </p>
            <p style="font-size: 12px; color: #666;">
                Copia este código y úsalo en la aplicación para restablecer tu contraseña.
            </p>
        </div>

        <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Este código expira en <strong>60 minutos</strong></li>
                <li>Solo puede ser usado una vez</li>
                <li>No compartas este código con nadie</li>
            </ul>
        </div>

        <div class="content">
            <h3>📱 Pasos para restablecer:</h3>
            <ol>
                <li>Abre la aplicación EPS</li>
                <li>Ve a la pantalla de "Restablecer Contraseña"</li>
                <li>Ingresa tu correo electrónico: <strong>{{ $email }}</strong></li>
                <li>Ingresa el código: <strong>{{ $token }}</strong></li>
                <li>Crea tu nueva contraseña</li>
            </ol>
        </div>

        <div class="footer">
            <p>Este correo fue enviado automáticamente por el sistema EPS API.</p>
            <p>Si necesitas ayuda, contacta al administrador del sistema.</p>
            <p><small>Fecha: {{ date('d/m/Y H:i:s') }}</small></p>
        </div>
    </div>
</body>
</html>