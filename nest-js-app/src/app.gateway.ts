import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsResponse,
} from '@nestjs/websockets';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  afterInit(server: any): void {
    console.log('\n------------------Server is ready------------------\n');
  }
  handleDisconnect(client: any) {
    console.log(`Client Disconnected: ${client.id}`);
  }
  handleConnection(client: any, ...args: any[]) {
    console.log(`Client Connected: ${client.id}`);

    //--------------------------------initializing the objects--------------------------------
    const baranyok = [];
    const farkas = {
      x: Math.floor(Math.random() * 100),
      y: Math.floor(Math.random() * 100),
    };

    for (let i = 0; i < 100; i++) {
      baranyok.push({
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100),
      });
    }
    client.emit('initialize_position', {
      event: 'initialize_position',
      baranyok: baranyok,
      farkas: farkas,
    });

    //------------------------------------logic------------------------------------
    let farkas_speed = 1;
    let farkas_size = 25;
    let die_index = 1;

    const farkas_move: ReturnType<typeof setInterval> = setInterval(() => {
      const távolság_lista = [];
      const koordinata_lista = [];
      for (let j = 0; j < baranyok.length; j++) {
        const távolság = Math.sqrt(
          (baranyok[j].x - farkas.x) ** 2 + (baranyok[j].y - farkas.y) ** 2,
        );
        távolság_lista.push(távolság);
        koordinata_lista.push({ x: baranyok[j].x, y: baranyok[j].y });
      }
      die_index = távolság_lista.indexOf(Math.min(...távolság_lista));

      console.log(die_index);
      farkas_speed = 1;
      try {
        farkas.x = koordinata_lista[die_index].x * farkas_speed;
        farkas.y = koordinata_lista[die_index].y * farkas_speed;
      } catch {
        console.log('nincs barany');
        process.exit(1);
      }

      for (let i = 0; i < baranyok.length; i++) {
        if (baranyok[i].x === farkas.x && baranyok[i].y === farkas.y) {
          baranyok.splice(i, 1);
          farkas_size += 1;
        }
      }
    }, 100);

    const setIntervalConst: ReturnType<typeof setInterval> = setInterval(() => {
      console.log(`setinterval lefutott`);
      for (const i in baranyok) {
        const farkas_position_x = farkas.x;
        const farkas_position_y = farkas.y;

        //console.log(farkas_position_x, farkas_position_y);

        if (baranyok[i].x >= farkas_position_x) {
          baranyok[i].x += 0.1;
        }
        if (baranyok[i].x < farkas_position_x) {
          baranyok[i].x -= 0.1;
        }
        if (baranyok[i].y >= farkas_position_y) {
          baranyok[i].y += 0.1;
        }
        if (baranyok[i].y < farkas_position_y) {
          baranyok[i].y -= 0.1;
        }
      }

      client.emit('moving_away_from_the_wolf', {
        event: 'moving_away_from_the_wolf',
        baranyok: baranyok,
        farkas: farkas,
        farkas_size: farkas_size,
        die_index: die_index,
      });
    }, 100);
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): WsResponse {
    console.log(`sent message`);
    return { event: 'messageToClient', data: payload };
  }
}
