import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Pipes
import { DeviceBlueprintNameFromIdPipe } from '../pipes/device-blueprint-name-from-id.pipe';
import { DeviceTypeNameFromIdPipe } from '../pipes/device-type-name-from-id.pipe';
import { FromNowPipe, MomentPipe } from '../pipes/moment.pipe';
import { SolutionBlueprintFromSolutionBlueprintIdPipe } from '../pipes/solution-blueprint-from-solution-blueprint-id.pipe';
import { StringifyPipe } from '../pipes/stringify.pipe';

@NgModule({
    declarations: [
        DeviceBlueprintNameFromIdPipe,
        DeviceTypeNameFromIdPipe,
        MomentPipe,
        SolutionBlueprintFromSolutionBlueprintIdPipe,
        FromNowPipe,
        StringifyPipe
    ],
    exports: [
        DeviceBlueprintNameFromIdPipe,
        DeviceTypeNameFromIdPipe,
        MomentPipe,
        SolutionBlueprintFromSolutionBlueprintIdPipe,
        FromNowPipe,
        StringifyPipe
    ]
})
export class PipesModule {}