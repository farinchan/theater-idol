export const useAppName = () => {
  const config = useRuntimeConfig()
  const appName = computed(() => {
    return (config.public.appName as string) || 'Pekerja48'
  })

  return {
    appName
  }
}
