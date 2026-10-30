<?php
return [
// 'paths' => ['api/*', 'sanctum/csrf-cookie'],
// 'allowed_methods' => ['*'],
// 'allowed_origins' => ['http://localhost:3000', 'http://127.0.0.1:3000'],
// 'allowed_headers' => ['*'],
// 'supports_credentials' => true,

'paths' => ['api/*', 'sanctum/csrf-cookie', 'api/login', 'api/logout', 'api/register'],

'allowed_methods' => ['*'],

'allowed_origins' => [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',      // ✅ Ajoute cette ligne
    'http://127.0.0.1:5173', 
],


'allowed_origins_patterns' => [],

'allowed_headers' => ['*'],

'exposed_headers' => [],

'max_age' => 0,

'supports_credentials' => true,  // 🔥 important pour Sanctum si utilisé

];
