
import { Catch,  ArgumentsHost, ExceptionFilter, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToRpc();
    const response = ctx.getContext();
    const logger = new Logger('RpcCustomExceptionFilter');
    const rpcError = exception.getError();
    if (typeof rpcError === 'object' && 'status' in rpcError && 'message' in rpcError ) {
      const status = rpcError.status;
      return response.status(status).json(rpcError);
    }
    logger.log(rpcError)
    response.status(401).json({
      status : 400,
      message : rpcError,
    })
  }
}
