package search;

public class BinarySearchShift {
    // Pre: args.length > 0
    public static void main(String[] args) {
        int[] a = new int[args.length];
        for (int i = 0; i < args.length; i++) {
            a[i] = Integer.parseInt(args[i]);
        }
        int k = searchIterative(a);
        // int k = searchRecursive(a, 0, args.length - 1);
        System.out.println(k);
    }
    // Post: prints k


    // Pre: a.length > 0
    private static int searchIterative(int[] a) {
        // Pre: a.length > 0
        int l = 0;
        // Post: a.length > 0 && l == 0
        // Pre: a.length > 0
        int r = a.length - 1;
        // Post: a.length > 0 && r == a.length - 1

        // Pre: 
        while (r > l) {
            int m = (l + r) / 2;
            if (a[l] <= a[m] && a[m] <= a[r]) {
                return l;
            }
            if (a[m] >= a[l]) {
                l = m + 1;
            } else {
                r = m;
            }
        }
        return l;
    }
    // Post: forall i,j=0..l - 1: (i < j) -> (args[i] <= args[j])
    //      && forall i,j=l..a.length - 1: (i < j) -> (args[i] <= args[j])
    //      && (l == 0) || (args[l - 1] >= args[l])

    // Pre: 
    private static int searchRecursive(int[] a, int l, int r) {
        if (l >= r || a[l] <= a[r]) {
            return l;
        }
        int m = (l + r) / 2;
        if (a[m] >= a[l]) {
            return searchRecursive(a, m + 1, r);
        } else {
            return searchRecursive(a, l, m);
        }
    }
    // Post: forall i,j=0..l - 1: (i < j) -> (args[i] <= args[j])
    //      && forall i,j=l..a.length - 1: (i < j) -> (args[i] <= args[j])
    //      && (l == 0) || (args[l - 1] >= args[l])
}

