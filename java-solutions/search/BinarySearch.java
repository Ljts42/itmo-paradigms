package search;

public class BinarySearch {
    // Pre: args.length >= 2 && 
    //      forall i,j=1..args.length - 1: i >= j || args[i] >= args[j]
    public static void main(String[] args) {
        // Pre: args.length > 1
        int x = Integer.parseInt(args[0]);
        // Post: x == args[0]


        int[] a = new int[args.length - 1];


        for (int i = 1; i < args.length; i++) {
            a[i - 1] = Integer.parseInt(args[i]);
        }

        System.out.println(searchIterative(x, a));
        // System.out.println(searchRecursive(x, a, 0, a.length));
    }
    // Post: prints result


    // Pre: 
    private static int searchIterative(int x, int[] a) {
        int l = 0;
        int r = a.length;

        while (l < r) {
            int m = (l + r) / 2;
            if (a[m] <= x) {
                r = m;
            } else {
                l = m + 1;
            }
        }
        return l;
    }
    // Post:


    // Pre:
    private static int searchRecursive(int x, int[] a, int l, int r) {
        if (l >= r) {
            return l;
        }

        int m = (l + r) / 2;
        if (a[m] <= x) {
            return searchRecursive(x, a, l, m);
        } else {
            return searchRecursive(x, a, m + 1, r);
        }
    }
    // Post:
}

