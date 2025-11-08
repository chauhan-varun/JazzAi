import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from '@/lib/socket/server';
import logger from '@/lib/logger';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      logger.error('Error handling request', { error: err });
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize Socket.io
  initSocketServer(httpServer);

  httpServer.listen(port, () => {
    logger.info(`> Ready on http://${hostname}:${port}`);
  });
});

