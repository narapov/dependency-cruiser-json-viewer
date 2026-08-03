/** Socket.io event emitted when cruise-result.json changes in watch mode. */
export const CRUISE_RESULT_CHANGED_EVENT = 'cruise-result:changed';

/** Socket.io path (avoids colliding with Vite HMR). */
export const CRUISE_RESULT_SOCKET_PATH = '/api/cruise-result-socket.io';
