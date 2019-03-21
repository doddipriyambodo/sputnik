import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MurataVibrationSensorGatewayV10Component } from './murata-vibration-sensor-gateway-v1-0.component';

// Pipes
import { PipesModule } from '../../../../pipes/pipes.module';

@NgModule({
    declarations: [MurataVibrationSensorGatewayV10Component],
    exports: [MurataVibrationSensorGatewayV10Component],
    imports: [PipesModule, CommonModule],
    providers: []
})
export class MurataVibrationSensorGatewayV10Module {}