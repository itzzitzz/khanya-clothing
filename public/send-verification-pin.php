<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get JSON data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validate required fields
if (empty($data['email'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email is required']);
    exit();
}

$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit();
}

// Generate 6-digit PIN
$pinCode = str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT);

// Store PIN in database (you'll need to handle this separately via your Supabase client)
// For now, we'll just send the email

$to = $email;
$subject = "Your Verification PIN - Khanya";

// HTML email body
$htmlBody = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body>
    <div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, \'Fira Sans\', \'Droid Sans\', \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #222; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="margin: 0 0 16px; color: #000;">Email Verification</h2>
        <p style="margin: 0 0 20px;">Your verification PIN is:</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 32px; letter-spacing: 8px; color: #000; margin: 0;">' . $pinCode . '</h1>
        </div>
        <p style="margin: 20px 0;">This PIN will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 14px; margin: 20px 0;">If you didn\'t request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p style="font-size: 13px; color: #888; margin: 0;">Khanya - Quality secondhand clothing bales</p>
    </div>
</body>
</html>
';

// Plain text version
$textBody = "Your verification PIN is: $pinCode\n\n";
$textBody .= "This PIN will expire in 10 minutes.\n\n";
$textBody .= "If you didn't request this, please ignore this email.\n\n";
$textBody .= "---\n";
$textBody .= "Khanya - Quality secondhand clothing bales";

// Email headers
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "From: Khanya <sales@khanya.store>\r\n";
$headers .= "Reply-To: sales@khanya.store\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Send email
$mailSent = mail($to, $subject, $htmlBody, $headers);

if ($mailSent) {
    error_log("Verification PIN sent successfully to: $email");
    echo json_encode([
        'success' => true,
        'message' => 'PIN sent to your email',
        'pin_code' => $pinCode,
        'email' => $email
    ]);
} else {
    error_log("Failed to send verification PIN to: $email");
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to send email. Please try again.'
    ]);
}
?>
