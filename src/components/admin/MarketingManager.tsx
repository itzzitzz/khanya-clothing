import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Send, Mail, Users, CheckCircle2, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  active: boolean;
}

interface CampaignSend {
  id: string;
  campaign_id: string;
  customer_email: string;
  customer_name: string;
  sent_at: string;
}

interface CustomerWithStatus {
  email: string;
  name: string;
  sent: boolean;
  sent_at?: string;
}

export function MarketingManager() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerWithStatus[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [sending, setSending] = useState(false);
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDescription, setNewCampaignDescription] = useState("");
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchCustomersForCampaign(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
      
      // Auto-select the first campaign
      if (data && data.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersForCampaign = async (campaignId: string) => {
    setLoadingCustomers(true);
    try {
      // Fetch all unique customers from delivered orders only
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("customer_email, customer_name")
        .eq("order_status", "delivered")
        .neq("payment_tracking_status", "Refunded")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch campaign sends for this campaign
      const { data: sends, error: sendsError } = await supabase
        .from("campaign_sends")
        .select("*")
        .eq("campaign_id", campaignId);

      if (sendsError) throw sendsError;

      // Create a map of sent emails
      const sentMap = new Map<string, CampaignSend>();
      (sends || []).forEach((send) => {
        sentMap.set(send.customer_email, send);
      });

      // Get unique customers
      const uniqueCustomers = new Map<string, CustomerWithStatus>();
      (orders || []).forEach((order) => {
        if (!uniqueCustomers.has(order.customer_email)) {
          const send = sentMap.get(order.customer_email);
          uniqueCustomers.set(order.customer_email, {
            email: order.customer_email,
            name: order.customer_name,
            sent: !!send,
            sent_at: send?.sent_at,
          });
        }
      });

      const customerList = Array.from(uniqueCustomers.values());
      setCustomers(customerList);
      
      // Set default selection: tick those who haven't received the email
      const defaultSelected = new Set<string>();
      customerList.forEach((customer) => {
        if (!customer.sent) {
          defaultSelected.add(customer.email);
        }
      });
      setSelectedEmails(defaultSelected);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoadingCustomers(false);
    }
  };

  const createCampaign = async () => {
    if (!newCampaignName.trim()) {
      toast({
        title: "Error",
        description: "Campaign name is required",
        variant: "destructive",
      });
      return;
    }

    setCreatingCampaign(true);
    try {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .insert({
          name: newCampaignName.trim(),
          description: newCampaignDescription.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setCampaigns([data, ...campaigns]);
      setNewCampaignOpen(false);
      setNewCampaignName("");
      setNewCampaignDescription("");
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setCreatingCampaign(false);
    }
  };

  const toggleCustomerSelection = (email: string) => {
    setSelectedEmails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(email)) {
        newSet.delete(email);
      } else {
        newSet.add(email);
      }
      return newSet;
    });
  };

  const toggleAllSelection = () => {
    if (selectedEmails.size === customers.length) {
      // Deselect all
      setSelectedEmails(new Set());
    } else {
      // Select all
      setSelectedEmails(new Set(customers.map((c) => c.email)));
    }
  };

  const sendCampaign = async () => {
    if (!selectedCampaignId) return;

    const selectedCustomers = customers.filter((c) => selectedEmails.has(c.email));
    if (selectedCustomers.length === 0) {
      toast({
        title: "No recipients selected",
        description: "Please select at least one customer to send the campaign to",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-marketing-campaign", {
        body: {
          campaign_id: selectedCampaignId,
          recipients: selectedCustomers.map((c) => ({
            email: c.email,
            name: c.name,
          })),
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Campaign sent to ${selectedCustomers.length} customer(s)`,
      });

      // Refresh the customer list
      fetchCustomersForCampaign(selectedCampaignId);
    } catch (error) {
      console.error("Error sending campaign:", error);
      toast({
        title: "Error",
        description: "Failed to send campaign",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
  const unsentCount = customers.filter((c) => !c.sent).length;
  const sentCount = customers.filter((c) => c.sent).length;
  const selectedCount = selectedEmails.size;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketing Campaigns</h2>
          <p className="text-muted-foreground">
            Send email campaigns to your customers
          </p>
        </div>
        <Dialog open={newCampaignOpen} onOpenChange={setNewCampaignOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Add a new marketing campaign to send to your customers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Holiday Sale Announcement"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What is this campaign about?"
                  value={newCampaignDescription}
                  onChange={(e) => setNewCampaignDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setNewCampaignOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={createCampaign} disabled={creatingCampaign}>
                {creatingCampaign && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{customers.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{sentCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{unsentCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Campaign Recipients</CardTitle>
              <CardDescription>
                Select a campaign to see customer status
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select
                value={selectedCampaignId || ""}
                onValueChange={setSelectedCampaignId}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCampaignId && selectedCount > 0 && (
                <Button onClick={sendCampaign} disabled={sending}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send to {selectedCount} customer{selectedCount !== 1 ? "s" : ""}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedCampaign && (
            <p className="text-sm text-muted-foreground mb-4">
              {selectedCampaign.description}
            </p>
          )}

          {loadingCustomers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No customers found</p>
              <p className="text-sm">Customers will appear here once they place orders</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedEmails.size === customers.length && customers.length > 0}
                      onCheckedChange={toggleAllSelection}
                      aria-label="Select all customers"
                    />
                  </TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.email}>
                    <TableCell>
                      <Checkbox
                        checked={selectedEmails.has(customer.email)}
                        onCheckedChange={() => toggleCustomerSelection(customer.email)}
                        aria-label={`Select ${customer.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {customer.name}
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      {customer.sent ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Sent
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.sent_at
                        ? new Date(customer.sent_at).toLocaleDateString("en-ZA", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}