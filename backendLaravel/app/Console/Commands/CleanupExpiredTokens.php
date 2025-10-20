<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CleanupExpiredTokens extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'auth:cleanup-expired-tokens';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired password reset tokens';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🧹 Cleaning up expired password reset tokens...');
        
        // Delete tokens older than 60 minutes
        $deleted = DB::table('password_reset_tokens')
            ->where('created_at', '<', Carbon::now()->subMinutes(60))
            ->delete();
            
        $this->info("✅ Deleted {$deleted} expired tokens.");
        
        // Show remaining active tokens
        $remaining = DB::table('password_reset_tokens')->count();
        $this->info("📊 {$remaining} active tokens remaining.");
        
        return 0;
    }
}
