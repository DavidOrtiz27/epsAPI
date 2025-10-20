<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TestResetPassword extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:show-reset-tokens {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Show reset password tokens for testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        
        $this->info("Looking for reset tokens for: {$email}");
        
        $tokens = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->get();
            
        if ($tokens->isEmpty()) {
            $this->warn("No tokens found for this email.");
            return;
        }
        
        foreach ($tokens as $tokenRecord) {
            $this->info("Email: " . $tokenRecord->email);
            $this->info("Token (hashed): " . $tokenRecord->token);
            $this->info("Created at: " . $tokenRecord->created_at);
            
            $createdAt = Carbon::parse($tokenRecord->created_at);
            $expiresAt = $createdAt->addMinutes(60);
            $isExpired = $expiresAt->isPast();
            
            $this->info("Expires at: " . $expiresAt->toDateTimeString());
            $this->info("Is expired: " . ($isExpired ? 'Yes' : 'No'));
            
            if (!$isExpired) {
                $this->info("✅ This token is still valid for testing.");
                $this->info("Note: The actual token (not hashed) was sent to the email.");
            } else {
                $this->warn("⚠️ This token has expired.");
            }
            
            $this->line("---");
        }
    }
}
