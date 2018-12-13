import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RPI3SenseHatDemoV10Component } from './rpi3-sense-hat-demo-v1-0.component';

// Pipes
import { PipesModule } from '../../../../pipes/pipes.module';

@NgModule({
    declarations: [RPI3SenseHatDemoV10Component],
    exports: [RPI3SenseHatDemoV10Component],
    imports: [PipesModule, CommonModule],
    providers: []
})
export class RPI3SenseHatDemoV10Module {}