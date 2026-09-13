/**
 * Body classes reach the backdrop outside the page subtree.
 * Intent: each depth title names its section; its specific meaning is recorded beside the page's depth prop.
 */
export function useDepthHead(
  depth: string,
  ownTitle?: MaybeRefOrGetter<string | undefined>,
  documentTitle?: MaybeRefOrGetter<string | undefined>,
) {
  const { t } = useI18n()

  const title = computed(() => toValue(ownTitle) ?? t(`${depth}.title`))

  useHead({
    bodyAttrs: { class: `depth depth-${depth}` },
    title: computed(() => `${toValue(documentTitle) ?? title.value} · ${t('brand.name')}`),
  })

  return { title }
}
