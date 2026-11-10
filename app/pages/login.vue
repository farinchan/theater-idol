<script setup lang="ts">
import { authService } from '~/services/auth-service'
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const appName = ref((config.public?.appName as string) || 'Theater Idol')

const { state, setUser, setToken, logout } = useAuth()
const isLoading = ref(false)

useSeoMeta({
  title: 'Masuk / Daftar Akun - Theater Idol',
  description: 'Masuk atau buat akun baru di Theater Idol untuk menikmati fitur interaktif live chat, pembelian member premium, dan akses eksklusif.',
  robots: 'noindex, follow'
})

const mode = ref<'login' | 'register' | '2fa'>('login')
const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  otpCode: ''
})

const preAuthToken = ref<string | null>(null)
const localError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Hanya alihkan ke profil jika user sudah login dan TIDAK sedang membawa parameter redirect
onMounted(() => {
  if (state.isLoggedIn && !route.query.redirect) {
    router.replace('/profile')
  }
})

// Trigger Google OAuth Login (jika token dikirim via query atau popup)
const handleGoogleLogin = async () => {
  localError.value = null
  successMessage.value = null
  isLoading.value = true

  try {
    // Membuka Google Sign In jika Google Client ID terkonfigurasi atau via token prompt
    const promptToken = prompt('Masukkan Google ID Token / Access Token:')
    if (!promptToken) {
      isLoading.value = false
      return
    }

    const res = await authService.google({
      credential: promptToken,
      id_token: promptToken
    })

    if (res.data?.token && res.data?.user) {
      setUser(res.data.user)
      setToken(res.data.token)
      successMessage.value = `Selamat datang, ${res.data.user.name || 'Pengguna'}! Berhasil masuk dengan Google.`
      const target = (route.query.redirect as string) || '/profile'
      setTimeout(() => router.replace(target), 800)
    }
  } catch (err: any) {
    localError.value = err?.response?.data?.message || err?.message || 'Gagal masuk dengan Google.'
  } finally {
    isLoading.value = false
  }
}

const handleVerify2FA = async () => {
  if (!preAuthToken.value || !form.otpCode || form.otpCode.length !== 6) {
    localError.value = 'Silakan masukkan 6 digit kode verifikasi 2FA yang dikirim ke email.'
    return
  }

  isLoading.value = true
  localError.value = null
  successMessage.value = null

  try {
    const res = await authService.verify2FA({
      pre_auth_token: preAuthToken.value,
      code: form.otpCode
    })

    if (res.data?.token && res.data?.user) {
      setUser(res.data.user)
      setToken(res.data.token)
      successMessage.value = 'Verifikasi 2FA berhasil! Mengalihkan...'
      const target = (route.query.redirect as string) || '/profile'
      setTimeout(() => router.replace(target), 800)
    }
  } catch (err: any) {
    localError.value = err?.response?.data?.message || err?.message || 'Kode 2FA tidak valid atau sudah kadaluarsa.'
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  localError.value = null
  successMessage.value = null

  if (mode.value === '2fa') {
    await handleVerify2FA()
    return
  }

  if (!form.email || !form.password) {
    localError.value = 'Silakan isi email dan kata sandi.'
    return
  }

  if (form.password.length < 6) {
    localError.value = 'Kata sandi minimal harus 6 karakter.'
    return
  }

  isLoading.value = true

  try {
    if (mode.value === 'register') {
      if (!form.name.trim()) {
        localError.value = 'Nama lengkap / panggilan wota wajib diisi.'
        isLoading.value = false
        return
      }
      if (form.password !== form.confirmPassword) {
        localError.value = 'Konfirmasi kata sandi tidak cocok.'
        isLoading.value = false
        return
      }

      const res = await authService.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password
      })

      if (res.success) {
        successMessage.value = 'Akun berhasil dibuat! Silakan masuk dengan email dan kata sandi Anda.'
        mode.value = 'login'
        form.password = ''
        form.confirmPassword = ''
      }
    } else {
      const res = await authService.login({
        email: form.email.trim(),
        password: form.password
      })

      if (res.data?.two_factor_required && res.data?.pre_auth_token) {
        preAuthToken.value = res.data.pre_auth_token
        mode.value = '2fa'
        successMessage.value = 'Kode verifikasi 2FA telah dikirim ke email Anda. Silakan masukkan 6 digit kode OTP.'
      } else if (res.data?.token && res.data?.user) {
        setUser(res.data.user)
        setToken(res.data.token)
        successMessage.value = 'Berhasil masuk! Mengalihkan...'
        const target = (route.query.redirect as string) || '/profile'
        setTimeout(() => router.replace(target), 800)
      }
    }
  } catch (err: any) {
    localError.value = err?.response?.data?.message || err?.message || 'Gagal memproses permintaan.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
    <div class="w-full max-w-md space-y-6">
      <!-- Brand & Header -->
      <div class="text-center space-y-2">
        <NuxtLink to="/" class="inline-block group">
          <span class="font-extrabold text-2xl tracking-tight text-neutral-900 dark:text-white uppercase">{{ appName }}</span>
        </NuxtLink>

        <div>
          <h1 class="text-2xl font-black tracking-tight text-neutral-900 dark:text-white mt-2">
            {{ mode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru' }}
          </h1>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Masuk atau daftar untuk mengakses fitur lengkap portal.
          </p>
        </div>
      </div>

      <!-- Main Card -->
      <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-sm space-y-6">
        <!-- Logged-in session notice -->
        <div v-if="state.isLoggedIn" class="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-2">
          <div class="flex items-center gap-2 text-xs font-bold text-primary">
            <UIcon name="i-lucide-user-check" class="w-4 h-4" />
            <span>Sedang Masuk sebagai {{ state.user?.name || state.user?.email }}</span>
          </div>
          <p class="text-[11px] text-neutral-500 dark:text-neutral-400">
            Anda sedang aktif dengan akun ini. Anda dapat melanjutkan atau masuk dengan akun lain.
          </p>
          <div class="flex items-center gap-2 pt-1">
            <UButton
              size="xs"
              color="primary"
              variant="solid"
              class="font-bold rounded-lg cursor-pointer"
              @click="router.replace((route.query.redirect as string) || '/profile')"
            >
              Lanjutkan
            </UButton>
            <UButton
              size="xs"
              color="neutral"
              variant="outline"
              class="font-bold rounded-lg cursor-pointer"
              @click="logout"
            >
              Keluar / Ganti Akun
            </UButton>
          </div>
        </div>

        <!-- Switch Tab Mode -->
        <div class="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60">
          <button
            type="button"
            :class="[
              'flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer',
              mode === 'login'
                ? 'bg-white dark:bg-neutral-900 text-primary shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            ]"
            @click="mode = 'login'; localError = null; successMessage = null"
          >
            Masuk
          </button>
          <button
            type="button"
            :class="[
              'flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer',
              mode === 'register'
                ? 'bg-white dark:bg-neutral-900 text-primary shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            ]"
            @click="mode = 'register'; localError = null; successMessage = null"
          >
            Daftar Baru
          </button>
        </div>

        <!-- Google OAuth Button -->
        <button
          type="button"
          :disabled="isLoading || isOAuthProcessing"
          class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-800/90 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-100 font-bold text-sm shadow-xs transition-all transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
          @click="handleGoogleLogin"
        >
          <!-- Google G Logo SVG -->
          <svg class="w-5 h-5 flex-shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
          </svg>
          <span v-if="isOAuthProcessing">Memproses Otorisasi Google...</span>
          <span v-else>{{ mode === 'login' ? 'Masuk dengan Google' : 'Daftar dengan Google' }}</span>
        </button>

        <!-- Divider -->
        <div class="flex items-center gap-3 my-1">
          <div class="flex-1 border-t border-neutral-200 dark:border-neutral-800" />
          <span class="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider whitespace-nowrap">
            atau gunakan email
          </span>
          <div class="flex-1 border-t border-neutral-200 dark:border-neutral-800" />
        </div>

        <!-- Feedback Alert Messages -->
        <div
          v-if="localError || authError"
          class="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5"
        >
          <UIcon name="i-lucide-alert-circle" class="w-4 h-4 flex-shrink-0" />
          <span>{{ localError || authError }}</span>
        </div>

        <div
          v-if="successMessage"
          class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5"
        >
          <UIcon name="i-lucide-check-circle-2" class="w-4 h-4 flex-shrink-0" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- Form Fields -->
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <!-- 2FA Verification Mode -->
          <template v-if="mode === '2fa'">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                Kode Verifikasi 2FA (6 Digit)
              </label>
              <UInput
                v-model="form.otpCode"
                type="text"
                maxlength="6"
                placeholder="Contoh: 123456"
                icon="i-lucide-key-round"
                size="md"
                class="w-full text-center tracking-widest font-mono text-lg"
                required
                autofocus
              />
              <p class="text-[11px] text-neutral-500 dark:text-neutral-400">
                Periksa kotak masuk email Anda untuk melihat kode OTP 6 digit.
              </p>
            </div>

            <UButton
              type="submit"
              color="primary"
              variant="solid"
              size="lg"
              class="w-full justify-center rounded-2xl font-bold mt-2 shadow-md shadow-primary/25 cursor-pointer"
              :loading="isLoading"
            >
              Verifikasi & Masuk
            </UButton>

            <button
              type="button"
              class="w-full text-center text-xs text-neutral-400 hover:text-primary pt-2 cursor-pointer"
              @click="mode = 'login'; preAuthToken = null; form.otpCode = ''"
            >
              Batal & Kembali ke Login
            </button>
          </template>

          <!-- Standard Login & Register Mode -->
          <template v-else>
            <div v-if="mode === 'register'" class="space-y-1.5">
              <label class="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                Nama Lengkap
              </label>
              <UInput
                v-model="form.name"
                type="text"
                placeholder="Contoh: Fajri"
                icon="i-lucide-user"
                size="md"
                class="w-full"
                required
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                Alamat Email
              </label>
              <UInput
                v-model="form.email"
                type="email"
                placeholder="nama@email.com"
                icon="i-lucide-mail"
                size="md"
                class="w-full"
                required
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                Kata Sandi
              </label>
              <UInput
                v-model="form.password"
                type="password"
                placeholder="Minimal 6 karakter..."
                icon="i-lucide-lock"
                size="md"
                class="w-full"
                required
              />
            </div>

            <div v-if="mode === 'register'" class="space-y-1.5">
              <label class="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                Konfirmasi Kata Sandi
              </label>
              <UInput
                v-model="form.confirmPassword"
                type="password"
                placeholder="Ulangi kata sandi..."
                icon="i-lucide-shield-check"
                size="md"
                class="w-full"
                required
              />
            </div>

            <UButton
              type="submit"
              color="primary"
              variant="solid"
              size="lg"
              class="w-full justify-center rounded-2xl font-bold mt-2 shadow-md shadow-primary/25 cursor-pointer"
              :loading="isLoading"
            >
              {{ mode === 'login' ? 'Masuk Sekarang' : 'Daftar & Buat Akun' }}
            </UButton>
          </template>
        </form>

        <!-- Security Notice -->
        <div class="pt-2 text-center border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400">
          <div class="flex items-center justify-center gap-1.5 font-medium">
            <UIcon name="i-lucide-shield-check" class="w-3.5 h-3.5 text-emerald-500" />
            <span>Enkripsi Aman & Verifikasi Akun Otomatis</span>
          </div>
        </div>
      </div>

      <!-- Back Link -->
      <div class="text-center">
        <NuxtLink to="/" class="text-xs font-bold text-neutral-500 hover:text-primary transition-colors inline-flex items-center gap-1">
          <UIcon name="i-lucide-arrow-left" class="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
