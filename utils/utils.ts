import { Socket } from "socket.io";

export default function handleWsError(client: Socket, message: string){
    client.emit('error', message);
    // client.disconnect(true)
    console.log(message)

    return false
}