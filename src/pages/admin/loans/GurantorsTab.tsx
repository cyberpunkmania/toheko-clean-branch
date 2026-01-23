import { Control } from "react-hook-form";
import { Card, CardHeader, CardContent, CardDescription } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash, Users } from "lucide-react";

interface GuarantorsTabProps {
  control: Control<any>;
  currentTab: string;
  fields: any[];
  append: (value: any) => void;
  remove: (index: number) => void;
  isLoading?: boolean;
}

const GuarantorsTab = ({ control, currentTab, fields, append, remove,isLoading }: GuarantorsTabProps) => {
  if (currentTab !== "guarantors") return null;
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
            <h3 className="text-lg font-semibold">Loading Guarantors...</h3>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-32">
            <div className="animate-pulse bg-gray-200 w-full h-full rounded-lg"></div>
            </CardContent>
        </Card>
        );
    }
//console.log("GuarantorsTab rendered with fields:", fields);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Loan Guarantors</h3>
        </div>
        <CardDescription>
          Add guarantors who will co-sign for this loan. Each guarantor must provide their details and guaranteed amount.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Guarantors List */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No guarantors added yet</p>
                <p className="text-sm">Click "Add Guarantor" to start</p>
              </div>
            ) : (
              fields.map((item, index) => (
                <div key={item.id} className="space-y-4 border border-gray-200 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-800">Guarantor {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Guarantor Name */}
                    <FormField
                      control={control}
                      name={`guarantors.${index}.guarantorName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Full Name <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter guarantor's full name"
                              className="bg-white focus:ring-2 focus:ring-blue-500" 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    {/* Relationship */}
                    <FormField
                      control={control}
                      name={`guarantors.${index}.relationship`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Relationship <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="e.g., Spouse, Friend, Colleague"
                              className="bg-white focus:ring-2 focus:ring-blue-500" 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    {/* Contact Number */}
                    <FormField
                      control={control}
                      name={`guarantors.${index}.guarantorContact`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Contact Number <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter phone number"
                              className="bg-white focus:ring-2 focus:ring-blue-500" 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    {/* ID Number */}
                    <FormField
                      control={control}
                      name={`guarantors.${index}.guarantorIdNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            ID Number <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter ID/Passport number"
                              className="bg-white focus:ring-2 focus:ring-blue-500" 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    {/* Guaranteed Amount */}
                    <FormField
                      control={control}
                      name={`guarantors.${index}.guaranteedAmount`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-sm font-medium">
                            Guaranteed Amount <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                              <Input 
                                type="number" 
                                {...field} 
                                placeholder="0.00"
                                className="bg-white pl-8 focus:ring-2 focus:ring-blue-500"
                                min="0"
                                step="0.01"
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                  field.onChange(value);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Add Guarantor Button */}
          <Button
            type="button"
            onClick={() =>
              append({
                guarantorName: "",
                relationship: "",
                guarantorContact: "",
                guarantorIdNumber: "",
                guaranteedAmount: 0,
              })
            }
            variant="outline"
            className="w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 py-3"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Guarantor
          </Button>

          {/* Summary Information */}
          {fields.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Guarantors Summary</span>
              </div>
              <div className="text-sm text-blue-700">
                <p>Total Guarantors: <span className="font-medium">{fields.length}</span></p>
                <p className="text-xs text-blue-600 mt-1">
                  Ensure all guarantor information is accurate and complete before submission.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default GuarantorsTab;