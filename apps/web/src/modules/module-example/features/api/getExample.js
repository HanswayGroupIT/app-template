import axiosInstance from "@/libs/axios"
import { unwrapApiList } from "@/utils/api"
import { queryOptions, useQuery } from "@tanstack/vue-query"

export const getExample = async input => {
  try {
    const response = await axiosInstance.get("/example", { params: input?.value })

    return unwrapApiList(response)
  } catch (err) {
    if (err?.response?.status === 404) {
      return { data: null }
    }

    throw err
  }
}

export const getExampleQueryOptions = input =>
  queryOptions({
    queryKey: ["example", input],
    queryFn: () => getExample(input),
    retry: false,
  })

export const useGetExample = ({ queryConfig, input } = {}) =>
  useQuery({ ...getExampleQueryOptions(input), ...queryConfig })
