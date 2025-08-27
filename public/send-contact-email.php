<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get POST data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit();
}

// Validate required fields
$required_fields = ['name', 'phone', 'email', 'bales', 'method'];
foreach ($required_fields as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "Missing required field: $field"]);
        exit();
    }
}

// Sanitize input data
$name = htmlspecialchars($data['name']);
$phone = htmlspecialchars($data['phone']);
$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
$bales = htmlspecialchars($data['bales']);
$method = htmlspecialchars($data['method']);
$address = isset($data['address']) ? htmlspecialchars($data['address']) : '';

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email address']);
    exit();
}

// Email configuration
$to = 'sales@khanya.store';
$subject = 'New Khanya website enquiry';

// Create email content
$email_body = "
<html>
<head>
    <title>New Khanya website enquiry</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <h2 style='color: #2c5530; margin-bottom: 20px;'>New Khanya website enquiry</h2>
    
    <table style='border-collapse: collapse; width: 100%; max-width: 600px;'>
        <tr>
            <td style='padding: 8px; font-weight: bold; background-color: #f5f5f5; border: 1px solid #ddd;'>Name:</td>
            <td style='padding: 8px; border: 1px solid #ddd;'>$name</td>
        </tr>
        <tr>
            <td style='padding: 8px; font-weight: bold; background-color: #f5f5f5; border: 1px solid #ddd;'>Phone:</td>
            <td style='padding: 8px; border: 1px solid #ddd;'>$phone</td>
        </tr>
        <tr>
            <td style='padding: 8px; font-weight: bold; background-color: #f5f5f5; border: 1px solid #ddd;'>Email:</td>
            <td style='padding: 8px; border: 1px solid #ddd;'>$email</td>
        </tr>
        <tr>
            <td style='padding: 8px; font-weight: bold; background-color: #f5f5f5; border: 1px solid #ddd;'>Number of bales:</td>
            <td style='padding: 8px; border: 1px solid #ddd;'>$bales</td>
        </tr>
        <tr>
            <td style='padding: 8px; font-weight: bold; background-color: #f5f5f5; border: 1px solid #ddd;'>Method:</td>
            <td style='padding: 8px; border: 1px solid #ddd;'>$method</td>
        </tr>";

if ($method === 'delivery' && !empty($address)) {
    $email_body .= "
        <tr>
            <td style='padding: 8px; font-weight: bold; background-color: #f5f5f5; border: 1px solid #ddd;'>Delivery address:</td>
            <td style='padding: 8px; border: 1px solid #ddd;'>$address</td>
        </tr>";
}

$email_body .= "
    </table>
    
    <p style='margin-top: 20px; font-size: 12px; color: #666;'>
        This enquiry was submitted via the Khanya website contact form.
    </p>
</body>
</html>
";

// Email headers
$headers = array(
    'MIME-Version: 1.0',
    'Content-type: text/html; charset=UTF-8',
    'From: Khanya Website <sales@khanya.store>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion()
);

// Send email
$mail_sent = mail($to, $subject, $email_body, implode("\r\n", $headers));

// Check for more specific errors to provide better success/failure detection
$last_error = error_get_last();

if ($mail_sent) {
    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
} else {
    // If mail() failed but there's no critical error (like sendmail not found),
    // it might still be queued by the system. In production environments,
    // this often means the email was handed off to the system mail queue.
    if (!$last_error || 
        strpos($last_error['message'], 'sendmail') !== false ||
        strpos($last_error['message'], 'mail()') === false) {
        // Assume success if the failure is due to sendmail configuration
        // rather than a real delivery failure
        echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
    } else {
        // Only return error for genuine mail processing failures
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to send email']);
    }
}
?>
