export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Nodejs HW API',
    version: '1.0.0',
    description: 'API documentation for auth, users, and notes endpoints.',
  },
  servers: [
    {
      url: process.env.BACKEND_URL || 'http://localhost:3000',
      description: 'Current server',
    },
  ],
  tags: [{ name: 'Auth' }, { name: 'Users' }, { name: 'Notes' }],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '67f7c7fbf52d0f0fd2db4d88' },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          username: { type: 'string', example: 'user@example.com' },
          avatar: {
            type: 'string',
            format: 'uri',
            example:
              'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg',
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Note: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '67f7ca4bf52d0f0fd2db4dc5' },
          title: { type: 'string', example: 'Buy milk' },
          content: { type: 'string', example: '2 liters and bread' },
          tag: {
            type: 'string',
            enum: [
              'Work',
              'Personal',
              'Meeting',
              'Shopping',
              'Ideas',
              'Travel',
              'Finance',
              'Health',
              'Important',
              'Todo',
            ],
          },
          userId: { type: 'string', example: '67f7c7fbf52d0f0fd2db4d88' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      NotesListResponse: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          perPage: { type: 'integer', example: 10 },
          totalNotes: { type: 'integer', example: 24 },
          totalPages: { type: 'integer', example: 3 },
          notes: {
            type: 'array',
            items: { $ref: '#/components/schemas/Note' },
          },
        },
      },
      MessageResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Session refreshed' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Invalid credentials' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          409: { description: 'Email in use' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout user',
        responses: {
          204: { description: 'No Content' },
        },
      },
    },
    '/auth/session': {
      get: {
        tags: ['Auth'],
        summary: 'Get current session user',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          401: { description: 'Session not found' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh session',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/request-reset-email': {
      post: {
        tags: ['Auth'],
        summary: 'Request reset password email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset user password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password', 'token'],
                properties: {
                  password: { type: 'string', minLength: 8 },
                  token: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          401: { description: 'Invalid or expired token' },
          404: { description: 'User not found' },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current user profile',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update current user',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username'],
                properties: {
                  username: { type: 'string', example: 'new_name' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    },
    '/users/me/avatar': {
      patch: {
        tags: ['Users'],
        summary: 'Update current user avatar',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  avatar: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file in avatar field',
                  },
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file in file field',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', format: 'uri' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Avatar file is required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/notes': {
      get: {
        tags: ['Notes'],
        summary: 'Get paginated notes list',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'tag',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'Work',
                'Personal',
                'Meeting',
                'Shopping',
                'Ideas',
                'Travel',
                'Finance',
                'Health',
                'Important',
                'Todo',
              ],
            },
          },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'perPage',
            in: 'query',
            schema: { type: 'integer', minimum: 5, maximum: 20 },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotesListResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Notes'],
        summary: 'Create note',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  tag: {
                    type: 'string',
                    enum: [
                      'Work',
                      'Personal',
                      'Meeting',
                      'Shopping',
                      'Ideas',
                      'Travel',
                      'Finance',
                      'Health',
                      'Important',
                      'Todo',
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Note' },
              },
            },
          },
        },
      },
    },
    '/notes/{noteId}': {
      get: {
        tags: ['Notes'],
        summary: 'Get note by id',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'noteId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Note' },
              },
            },
          },
          404: { description: 'Note not found' },
        },
      },
      patch: {
        tags: ['Notes'],
        summary: 'Update note',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'noteId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  tag: {
                    type: 'string',
                    enum: [
                      'Work',
                      'Personal',
                      'Meeting',
                      'Shopping',
                      'Ideas',
                      'Travel',
                      'Finance',
                      'Health',
                      'Important',
                      'Todo',
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Note' },
              },
            },
          },
          404: { description: 'Note not found' },
        },
      },
      delete: {
        tags: ['Notes'],
        summary: 'Delete note',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'noteId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Note' },
              },
            },
          },
          404: { description: 'Note not found' },
        },
      },
    },
  },
};
