export const wrapApiCall = async <T>(
  actionName: string,
  apiCall: () => Promise<T>,
  store = useGlobalStore()
): Promise<T> => {
  const { start, end, handleErrors } = store

  try {
    start(actionName)
    return await apiCall()
  } catch (error) {
    if (error == 'Unauthorized') {
      throw error
    } else {
      handleErrors(error)
      throw error
    }
  } finally {
    end(actionName)
  }
}
