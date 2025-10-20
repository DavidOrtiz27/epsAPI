<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use App\Models\User;

class TestRegister extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:register {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test register functionality';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        
        $this->info("Testing registration for: {$email}");
        
        // Check if user already exists
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            $this->error("❌ User already exists with this email!");
            $this->info("User ID: " . $existingUser->id);
            $this->info("User Name: " . $existingUser->name);
            $this->info("Created: " . $existingUser->created_at);
            return;
        }
        
        // Create a mock request
        $request = new Request();
        $request->merge([
            'name' => 'Juan David Ortiz',
            'email' => $email,
            'password' => 'nala1234',
            'documento' => '1057578905',
            'telefono' => '3104780795',
            'direccion' => 'calle 4 #12-64',
            'fecha_nacimiento' => '2006-08-27',
            'genero' => 'M'
        ]);
        
        // Test the controller method
        $controller = new AuthController();
        
        try {
            $response = $controller->register($request);
            $responseData = $response->getData(true);
            
            $this->info("Response Status: " . $response->getStatusCode());
            
            if ($response->getStatusCode() === 201) {
                $this->info("✅ Registration successful!");
                $this->info("User ID: " . $responseData['user']['id']);
                $this->info("User Name: " . $responseData['user']['name']);
            } else {
                $this->error("❌ Registration failed. Status: " . $response->getStatusCode());
                if (isset($responseData['message'])) {
                    $this->error("Message: " . $responseData['message']);
                }
                if (isset($responseData['errors'])) {
                    $this->error("Errors: " . json_encode($responseData['errors'], JSON_PRETTY_PRINT));
                }
            }
            
        } catch (\Exception $e) {
            $this->error("Exception occurred: " . $e->getMessage());
            $this->error("Line: " . $e->getLine());
            $this->error("File: " . $e->getFile());
        }
    }
}
