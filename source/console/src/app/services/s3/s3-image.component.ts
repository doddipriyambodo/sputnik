import { Component, Input, OnChanges } from '@angular/core';

// Services
import { LoggerService } from 'src/app/services/logger.service';
import { S3Service } from 'src/app/services/s3/s3.service';

declare var appVariables: any;


@Component({
    selector: 'app-s3-image',
    template: '<img [src]="signedUrl" width="100%">'
})
export class S3ImageComponent implements OnChanges {

    @Input()
    s3Key: string;

    public signedUrl: string;

    constructor(private logger: LoggerService, private s3Service: S3Service) {
        this.signedUrl = '';
    }

    ngOnChanges() {
        this.s3Service.getSignedUrlFor(this.s3Key).then((url: string) => {
            this.signedUrl = url;
        }).catch(err => {
            this.logger.error(err);
        });
    }

}
