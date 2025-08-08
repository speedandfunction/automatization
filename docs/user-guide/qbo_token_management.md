# QBO Token Management в Temporal

## Обзор

Система автоматически управляет OAuth2 токенами для QuickBooks Online в Temporal workflow. Это включает:

- Автоматическое обновление access tokens
- Сохранение новых refresh tokens
- Кэширование токенов между activities
- Уведомления о новых refresh tokens

## Архитектура

### OAuth2TokenManager

Основной класс для управления токенами:

```typescript
export class OAuth2TokenManager {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private refreshToken: string | null = null;
  private readonly tokenFilePath: string;
}
```

### Файловое хранилище

Токены сохраняются в файл `temp/qbo_tokens.json`:

```json
{
  "access_token": "ya29.a0AfH6SMC...",
  "refresh_token": "1//04dX...",
  "expires_at": 1703123456789,
  "token_type": "Bearer"
}
```

## Workflow Integration

### Автоматическое управление токенами

В `weeklyFinancialReportsWorkflow` добавлена activity `manageQBOTokens`:

```typescript
// Шаг 3: Управляем QBO токенами перед получением данных
const tokenResult = await manageQBOTokens();

if (!tokenResult.success) {
  throw new AppError(
    `Failed to manage QBO tokens: ${tokenResult.message}`,
    'weeklyFinancialReportsWorkflow',
  );
}

// Если получили новый refresh token, логируем это
if (tokenResult.newRefreshToken) {
  console.log('🔄 QBO refresh token updated during workflow execution');
}
```

### Activity: manageQBOTokens

```typescript
export async function manageQBOTokens(): Promise<TokenManagementResult> {
  const tokenManager = new OAuth2TokenManager();

  try {
    // Получаем текущий refresh token
    const currentRefreshToken = await tokenManager.getCurrentRefreshToken();
    
    // Получаем access token (это автоматически обновит токены если нужно)
    const accessToken = await tokenManager.getAccessToken();
    
    // Получаем обновленный refresh token
    const newRefreshToken = await tokenManager.getCurrentRefreshToken();
    
    const result: TokenManagementResult = {
      success: true,
      message: 'QBO tokens managed successfully',
      newRefreshToken: newRefreshToken !== currentRefreshToken ? newRefreshToken : undefined,
    };

    // Если получили новый refresh token, сохраняем его для workflow
    if (result.newRefreshToken) {
      const tokenUpdateData = {
        timestamp: new Date().toISOString(),
        newRefreshToken: result.newRefreshToken,
        message: 'QBO refresh token updated during workflow execution',
      };

      await writeJsonFile('temp/qbo_token_update.json', tokenUpdateData);
      
      result.message = 'QBO tokens refreshed and new refresh token saved';
      console.log('⚠️  NEW QBO REFRESH TOKEN SAVED - Check temp/qbo_token_update.json');
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      message: `Failed to manage QBO tokens: ${errorMessage}`,
    };
  }
}
```

## Жизненный цикл токенов

### 1. Инициализация

```typescript
const tokenManager = new OAuth2TokenManager();
```

### 2. Загрузка кэшированных токенов

```typescript
await this.loadTokensFromFile();
```

### 3. Проверка валидности

```typescript
if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
  return this.accessToken;
}
```

### 4. Обновление токенов

```typescript
await this.refreshAccessToken();
```

### 5. Сохранение новых токенов

```typescript
await this.saveTokensToFile();
```

## Мониторинг и уведомления

### Логирование

Система выводит подробные логи:

```
QBO tokens loaded from file
QBO OAuth2 token refreshed successfully
QBO tokens saved to file
⚠️  NEW REFRESH TOKEN RECEIVED - Update QBO_REFRESH_TOKEN environment variable
New refresh token: 1//04dX...
```

### Файл обновлений

При получении нового refresh token создается файл `temp/qbo_token_update.json`:

```json
{
  "timestamp": "2024-12-19T19:30:00.000Z",
  "newRefreshToken": "1//04dX...",
  "message": "QBO refresh token updated during workflow execution"
}
```

## Конфигурация

### Environment Variables

```bash
QBO_CLIENT_ID=your_client_id
QBO_CLIENT_SECRET=your_client_secret
QBO_REFRESH_TOKEN=your_refresh_token
QBO_API_URL=https://sandbox-accounts.platform.intuit.com
QBO_COMPANY_ID=your_company_id
```

### Обновление Refresh Token

Когда система получает новый refresh token:

1. **Автоматическое сохранение** - токен сохраняется в файл
2. **Уведомление** - выводится предупреждение в логах
3. **Ручное обновление** - обновите `QBO_REFRESH_TOKEN` в environment

## Обработка ошибок

### Типы ошибок

1. **Недостающие credentials**
   ```
   OAuth2 credentials not configured
   ```

2. **Ошибка обновления токена**
   ```
   OAuth2 token refresh failed: [error details]
   ```

3. **Ошибка получения токена**
   ```
   Failed to obtain access token
   ```

### Retry Logic

Temporal автоматически повторяет failed activities согласно настройкам:

```typescript
proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});
```

## Безопасность

### Хранение токенов

- Токены сохраняются в локальной файловой системе
- Файлы должны быть защищены от несанкционированного доступа
- Рекомендуется использовать encrypted storage в production

### Ротация токенов

- Access tokens автоматически обновляются
- Refresh tokens могут измениться при обновлении
- Система уведомляет о новых refresh tokens

## Тестирование

### Unit Tests

```bash
npm test -- OAuth2TokenManager.test.ts
```

### Integration Tests

```bash
# Запуск workflow с реальными токенами
npm run workflow:weekly-reports
```

## Troubleshooting

### Проблема: Токен не обновляется

**Решение:**
1. Проверьте логи на наличие ошибок
2. Убедитесь, что refresh token валиден
3. Проверьте network connectivity к QBO API

### Проблема: Новый refresh token не сохраняется

**Решение:**
1. Проверьте права доступа к директории `temp/`
2. Убедитесь, что файловая система доступна для записи
3. Проверьте логи на ошибки записи файла

### Проблема: Workflow падает с ошибкой токенов

**Решение:**
1. Проверьте конфигурацию environment variables
2. Убедитесь, что OAuth2 credentials корректны
3. Проверьте, что refresh token не истек

## Best Practices

1. **Мониторинг** - регулярно проверяйте логи на новые refresh tokens
2. **Backup** - сохраняйте refresh tokens в secure storage
3. **Rotation** - регулярно обновляйте OAuth2 credentials
4. **Testing** - тестируйте token refresh в sandbox environment
5. **Documentation** - документируйте изменения в token management 