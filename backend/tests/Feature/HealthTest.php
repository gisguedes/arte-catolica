<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function testHealthEndpointOk(): void
    {
        $this->get('/api/health')
            ->assertOk()
            ->assertJsonPath('checks.app', true);
    }
}
