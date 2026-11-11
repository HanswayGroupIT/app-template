import axiosInstance from "@/libs/axios"
import { useMutation, useQueryClient } from "@tanstack/vue-query"

export const useUpdateExample = (params = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async body => {
      await axiosInstance.post("/example", body)
    },
    ...params.mutationConfig,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["example"] })
      params.mutationConfig?.onSuccess?.(data, variables, context)
    },
  })
}