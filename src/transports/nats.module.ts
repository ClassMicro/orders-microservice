import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs,  } from 'src/config';
import { NAST_SERVICE } from 'src/config/service';

@Module({
    imports : [
        ClientsModule.register([
            {
                name : NAST_SERVICE,
                transport : Transport.NATS,
                options : {
                    servers : envs.nastServer
                }
            }
        ])
        
    ],
    exports : [
        ClientsModule.register([
            {
                name : NAST_SERVICE,
                transport : Transport.NATS,
                options : {
                    servers : envs.nastServer
                },
            },
        ]),
    ],
})

export class NatsModule {}
