# Quick Start Guide

## Get Started in 3 Steps

### Step 1: Install Dependencies

```bash
cd dcid-server-sdk
npm install
```

### Step 2: Build the SDK

```bash
npm run build
```

This creates the `dist/` folder with compiled JavaScript.

### Step 3: Test It Out

Create a test file `test-sdk.ts`:

```typescript
import { DCIDServerSDK } from './dist';

async function test() {
  const sdk = new DCIDServerSDK({
    baseUrl: 'http://localhost:4000/api', // Your portalapi URL
  });

  try {
    // Test registerOTP
    console.log('Testing registerOTP...');
    const result = await sdk.auth.registerOTP({
      email: 'test@example.com'
    });
    console.log('Success!', result);

    // If in dev mode, you'll get the OTP back
    if (result.otp) {
      console.log('OTP Code:', result.otp);

      // Test confirmOTP
      console.log('Testing confirmOTP...');
      const tokens = await sdk.auth.confirmOTP({
        email: 'test@example.com',
        otp: result.otp
      });
      console.log('Tokens received!', {
        access_token: tokens.access_token.substring(0, 20) + '...',
        refresh_token: tokens.refresh_token.substring(0, 20) + '...'
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
```

Run it:
```bash
npx ts-node test-sdk.ts
```

## What You Have Now

✅ **4 SDK Methods** covering your team leader's requirements:
- `registerOTP()` → `POST /auth/sign-in/initiate`
- `confirmOTP()` → `POST /auth/sign-in/confirm`
- `adminLogin()` → `POST /auth/login`
- `refreshToken()` → `POST /auth/refresh-token`

✅ **Full TypeScript support** with types
✅ **Error handling** with custom error class
✅ **Documentation** in README.md

## Next Steps

1. **Test with your actual API** - Make sure portalapi is running
2. **Review the code** - Check `src/auth/otp.ts` to see the methods
3. **Read the docs** - See `README.md` for full API reference
4. **Extend if needed** - Add more methods following the same pattern
