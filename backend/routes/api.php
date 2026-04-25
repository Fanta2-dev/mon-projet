<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/hello', function () {
    return response()->json([
        'message' => 'Bienvenue dans l’API Laravel 12 !'
    ]);
});




Route::post('/login', function (Request $request) {
    $credentials = $request->only('email', 'password');

    if (!Auth::attempt($credentials)) {
        return response()->json(['message' => 'Login failed'], 401);
    }

    $user = Auth::user();
    $token = $user->createToken('token-name')->plainTextToken;

    return response()->json(['token' => $token]);
});
