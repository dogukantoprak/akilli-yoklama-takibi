<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . 'bootstrap.php';

json_response([
    'ok' => false,
    'error' => 'Registration is disabled. Contact admin.',
], 403);
