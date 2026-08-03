import fs from 'node:fs';

import chokidar from 'chokidar';
import { Server as SocketIoServer } from 'socket.io';
import type { Plugin } from 'vite';

import {
  CRUISE_RESULT_CHANGED_EVENT,
  CRUISE_RESULT_SOCKET_PATH,
} from './src/Shared/constants/cruiseResultChangedEvent.ts';

/**
 * Dev-only cruise JSON serving and socket.io notifications when cruise-result.json changes.
 */
export function cruiseWatchPlugin(cruiseResultPath: string): Plugin {
  return {
    name: 'cruise-watch',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/envs.js') {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.end('window.envs = { watch: true };\n');
          return;
        }
        if (url !== '/cruise-result.json') {
          next();
          return;
        }
        if (!fs.existsSync(cruiseResultPath)) {
          res.statusCode = 404;
          res.end('Run: npm run depcruise:json-for-cli');
          return;
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        fs.createReadStream(cruiseResultPath).pipe(res);
      });

      let io: SocketIoServer | undefined;

      const emitCruiseResultChanged = () => {
        io?.emit(CRUISE_RESULT_CHANGED_EVENT);
      };

      const cruiseJsonWatcher = chokidar.watch(cruiseResultPath, {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
      });
      cruiseJsonWatcher.on('all', eventName => {
        if (eventName === 'add' || eventName === 'change') {
          emitCruiseResultChanged();
        }
      });

      const attachSocketIo = () => {
        const httpServer = server.httpServer;
        if (httpServer == null || io != null) {
          return;
        }
        io = new SocketIoServer(httpServer, { path: CRUISE_RESULT_SOCKET_PATH });
      };

      if (server.httpServer?.listening) {
        attachSocketIo();
      } else {
        server.httpServer?.once('listening', attachSocketIo);
      }

      server.httpServer?.on('close', () => {
        void cruiseJsonWatcher.close();
        void io?.close();
      });
    },
  };
}
