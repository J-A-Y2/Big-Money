import { AuthService } from '@auth/app/auth.service'
import { GoogleStrategy } from '@auth/infra/passport/strategies/google.stratgy'
import { LocalStrategy } from '@auth/infra/passport/strategies/local.strategy'
import { TokenService } from '@auth/infra/token.sevice'
import { CacheService } from '@cache/cache.service'
import {
  IAUTH_SERVICE,
  ITOKEN_SERVICE,
  IHANDLE_DATE_TIME,
  ICACHE_SERVICE,
} from '@common/constants/provider.constant'
import { HandleDateTime } from '@common/utils/handleDateTime'

export const AuthProvider = [
  LocalStrategy,
  GoogleStrategy,
  {
    provide: ITOKEN_SERVICE,
    useClass: TokenService,
  },
  {
    provide: IAUTH_SERVICE,
    useClass: AuthService,
  },
  {
    provide: IHANDLE_DATE_TIME,
    useClass: HandleDateTime,
  },
  { provide: ICACHE_SERVICE, useClass: CacheService },
]
