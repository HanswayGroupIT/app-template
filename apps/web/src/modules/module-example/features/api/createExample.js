import axiosInstance from "@/libs/axios"
import { useMutation, useQueryClient } from "@tanstack/vue-query"

export const useCreateExample = (params = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async body => {
      await axiosInstance.post("/examples", body)
    },
    ...params.mutationConfig,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["examples"] })
      params.mutationConfig?.onSuccess?.(data, variables, context)
    },
  })
}