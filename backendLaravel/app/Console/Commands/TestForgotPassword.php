<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use App\Models\User;

class TestForgotPassword extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:forgot-password {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test forgot password functionality';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        
        $this->info("Testing forgot password for: {$email}");
        $this->info("The system will validate if this email exists and is active...");
        
        // Create a mock request
        $request = new Request();
        $request->merge(['email' => $email]);
        
        // Test the controller method
        $controller = new AuthController();
        
        try {
            $response = $controller->forgotPassword($request);
            $responseData = $response->getData(true);
            
            $this->info("Response Status: " . $response->getStatusCode());
            $this->info("Response Message: " . ($responseData['message'] ?? 'No message'));
            
            if ($response->getStatusCode() === 200) {
                $this->info("✅ Forgot password functionality is working!");
                $this->info("Check your email inbox for the recovery code.");
            } else {
                $this->error("❌ Error occurred. Status: " . $response->getStatusCode());
            }
            
        } catch (\Exception $e) {
            $this->error("Exception occurred: " . $e->getMessage());
            $this->error("Line: " . $e->getLine());
            $this->error("File: " . $e->getFile());
        }
    }
}
