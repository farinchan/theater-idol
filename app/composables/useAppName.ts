export const useAppName = () => {
  const { appName: settingsAppName } = useSiteSettings()
  const config = useRuntimeConfig()

  const appName = computed(() => {
    return settingsAppName.value || (config.public.appName as string) || 'Theater Idol'
  })

  return {
    appName
  }
}
