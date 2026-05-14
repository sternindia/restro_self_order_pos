<?php
require 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$order_type   = $data['order_type'];
$table_id     = $data['table_id'];
$customer_id  = $data['customer_id'];
$cart         = $data['cart'];

$conn->begin_transaction();

try {

    // 1️⃣ INSERT ORDER
    $stmt = $conn->prepare("
        INSERT INTO orders (order_type, table_id, customer_id, order_status)
        VALUES (?, ?, ?, 'PENDING')
    ");
    $stmt->bind_param("sii", $order_type, $table_id, $customer_id);
    $stmt->execute();
    $order_id = $stmt->insert_id;

    $subtotal = 0;

    // 2️⃣ INSERT ORDER ITEMS
    foreach ($cart as $item_id => $item) {

        $qty   = $item['qty'];
        $price = $item['price'];
        $total = $qty * $price;
        $subtotal += $total;

        $stmt = $conn->prepare("
            INSERT INTO order_items (order_id, menu_item_id, quantity, price)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->bind_param("iiid", $order_id, $item_id, $qty, $price);
        $stmt->execute();
    }

    // 3️⃣ BILL CALCULATION
    $tax = ($subtotal * 5) / 100;
    $grand_total = $subtotal + $tax;

    // 4️⃣ INSERT BILL
    $stmt = $conn->prepare("
        INSERT INTO bills (order_id, subtotal, tax_amount, grand_total)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->bind_param("iddd", $order_id, $subtotal, $tax, $grand_total);
    $stmt->execute();

    $conn->commit();

    echo json_encode([
        "status" => "success",
        "order_id" => $order_id
    ]);

} catch (Exception $e) {

    $conn->rollback();
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
