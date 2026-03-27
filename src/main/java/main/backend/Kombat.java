package main.backend;

import java.util.*;
import java.util.regex.*;


public class Kombat {

    // CONFIG
    static final long   INIT_BUDGET  = 10000;
    static final long   MAX_BUDGET   = 50000;
    static final int    INIT_HP      = 100;
    static final long   TURN_BUDGET  = 100;
    static final double INTEREST     = 5.0;
    static final int    MAX_TURNS    = 200;

    // MODEL
    static class Player {
        int id;
        double budget;
        List<Minion> minions = new ArrayList<>();
        Map<String, Long> globals = new HashMap<>();

        Player(int id) { this.id = id; this.budget = INIT_BUDGET; }

        boolean spend(double amount) {
            if (budget >= amount) { budget -= amount; return true; }
            return false;
        }
        long getGlobal(String k) { return globals.getOrDefault(k, 0L); }
        void setGlobal(String k, long v) { globals.put(k, v); }
        long totalHp() { return minions.stream().filter(m -> m.hp > 0).mapToLong(m -> m.hp).sum(); }
        long aliveCount() { return minions.stream().filter(m -> m.hp > 0).count(); }
    }

    static class Minion {
        Player owner;
        int row, col, hp, maxHp, defense;
        Node strategy;
        Map<String, Long> locals = new HashMap<>();

        Minion(Player owner, int defense, int hp, Node strategy) {
            this.owner = owner; this.defense = defense;
            this.maxHp = hp; this.hp = hp; this.strategy = strategy;
        }
        boolean isAlive() { return hp > 0; }
        void damage(int d) { hp = Math.max(0, hp - d); }
    }

    static class Hex {
        int row, col;
        Minion occupant;
        Player owner;
        Hex(int r, int c) { row = r; col = c; }
    }

    static class GameState {
        Hex[][] board = new Hex[9][9]; // 1-indexed
        Player p1 = new Player(1);
        Player p2 = new Player(2);
        int turn = 1;
        Set<String> zone1 = new HashSet<>(Arrays.asList("1,1","1,2","1,3","2,1","2,2"));
        Set<String> zone2 = new HashSet<>(Arrays.asList("8,8","8,7","8,6","7,8","7,7"));

        GameState() {
            for (int r = 1; r <= 8; r++)
                for (int c = 1; c <= 8; c++)
                    board[r][c] = new Hex(r, c);
            for (String k : zone1) { int[] rc = parseKey(k); board[rc[0]][rc[1]].owner = p1; }
            for (String k : zone2) { int[] rc = parseKey(k); board[rc[0]][rc[1]].owner = p2; }
        }

        Hex hex(int r, int c) { return (r>=1&&r<=8&&c>=1&&c<=8) ? board[r][c] : null; }
        boolean valid(int r, int c) { return r>=1&&r<=8&&c>=1&&c<=8; }

        void place(Player p, Minion m, int r, int c) {
            board[r][c].occupant = m;
            m.row = r; m.col = c;
            p.minions.add(m);
        }

        void move(Minion m, String dir) {
            int[] n = neighbor(m.row, m.col, dir);
            if (valid(n[0],n[1]) && board[n[0]][n[1]].occupant == null) {
                board[m.row][m.col].occupant = null;
                board[n[0]][n[1]].occupant = m;
                m.row = n[0]; m.col = n[1];
            }
        }

        int[] neighbor(int row, int col, String dir) {
            boolean odd = (row % 2 != 0);
            switch (dir) {
                case "up":        return new int[]{row-1, col};
                case "down":      return new int[]{row+1, col};
                case "upleft":    return new int[]{row-1, odd ? col-1 : col};
                case "upright":   return new int[]{row-1, odd ? col   : col+1};
                case "downleft":  return new int[]{row+1, odd ? col-1 : col};
                case "downright": return new int[]{row+1, odd ? col   : col+1};
                default:          return new int[]{row, col};
            }
        }

        Player playerOf(int id) { return id == 1 ? p1 : p2; }
        long interest(long budget) {
            if (budget <= 0 || turn <= 1) return 0;
            return (long)(INTEREST * Math.log10(budget) * Math.log(turn));
        }
        void addTurnIncome(Player p) {
            long inc = TURN_BUDGET + interest((long) p.budget);
            p.budget = Math.min(MAX_BUDGET, p.budget + inc);
        }
        int[] parseKey(String k) {
            String[] s = k.split(","); return new int[]{Integer.parseInt(s[0]), Integer.parseInt(s[1])};
        }
    }

    // AST NODES
    interface Node {}
    interface Expr extends Node { long eval(Ctx ctx); }

    static class NumNode  implements Expr { long v; NumNode(long v){this.v=v;} public long eval(Ctx c){return v;} }
    static class VarNode  implements Expr { String n; VarNode(String n){this.n=n;} public long eval(Ctx c){return c.get(n);} }

    static class BinNode  implements Expr {
        Expr l, r; String op;
        BinNode(Expr l, String op, Expr r){this.l=l;this.op=op;this.r=r;}
        public long eval(Ctx c) {
            long lv=l.eval(c), rv=r.eval(c);
            switch(op){
                case "+": return lv+rv;
                case "-": return lv-rv;
                case "*": return lv*rv;
                case "/": return rv==0?0:lv/rv;
                case "%": return rv==0?0:lv%rv;
                case "^": long res=1; for(long i=0;i<rv;i++) res*=lv; return res;
                case ">": return lv>rv?1:0;
                case "<": return lv<rv?1:0;
                default:  return 0;
            }
        }
    }

    static class InfoNode implements Expr {
        String type, dir;
        InfoNode(String type, String dir){this.type=type;this.dir=dir;}
        public long eval(Ctx c){return c.info(type, dir);}
    }

    static class BlockNode implements Node { List<Node> stmts; BlockNode(List<Node> s){stmts=s;} }
    static class AssignNode implements Node { String name; Expr expr; AssignNode(String n,Expr e){name=n;expr=e;} }
    static class IfNode implements Node { Expr cond; Node then, els; IfNode(Expr c,Node t,Node e){cond=c;then=t;els=e;} }
    static class WhileNode implements Node { Expr cond; Node body; WhileNode(Expr c,Node b){cond=c;body=b;} }
    static class ActionNode implements Node { String action, dir; Expr amount; ActionNode(String a,String d,Expr e){action=a;dir=d;amount=e;} }

    // CONTEXT
    static class Ctx {
        Minion minion; GameState gs;
        Ctx(Minion m, GameState gs){ this.minion=m; this.gs=gs; }

        long get(String name) {
            switch(name) {
                case "row":       return minion.row;
                case "col":       return minion.col;
                case "Budget":    return (long) minion.owner.budget;
                case "MaxBudget": return MAX_BUDGET;
                case "Int":       return gs.interest((long) minion.owner.budget);
                case "random":    return (long)(Math.random()*1000);
            }
            if (Character.isUpperCase(name.charAt(0))) return minion.owner.getGlobal(name);
            return minion.locals.getOrDefault(name, 0L);
        }

        void set(String name, long val) {
            if (name.equals("row")||name.equals("col")||name.equals("Budget")||
                    name.equals("MaxBudget")||name.equals("Int")||name.equals("random")) return;
            if (Character.isUpperCase(name.charAt(0))) minion.owner.setGlobal(name, val);
            else minion.locals.put(name, val);
        }

        long info(String type, String dir) {
            if ("nearby".equals(type)) return nearby(dir);
            if ("ally".equals(type))   return closest(true);
            if ("opponent".equals(type)) return closest(false);
            return 0;
        }

        private long nearby(String dir) {
            int r = minion.row, c = minion.col, dist = 0;
            int maxSteps = 16;
            while (maxSteps-- > 0) {
                int[] n = gs.neighbor(r, c, dir); r = n[0]; c = n[1]; dist++;
                if (!gs.valid(r,c)) return 0;
                Minion t = gs.board[r][c].occupant;
                if (t != null) {
                    long x = String.valueOf(t.hp).length();
                    long y = String.valueOf(t.defense).length();
                    long val = 100*x + 10*y + dist;
                    return (t.owner == minion.owner) ? -val : val;
                }
            }
            return 0;
        }

        private long closest(boolean ally) {
            String[] dirs = {"up","upright","downright","down","downleft","upleft"};
            long best = 0; int minDist = Integer.MAX_VALUE;
            for (int d = 0; d < 6; d++) {
                int r = minion.row, c = minion.col, dist = 0;
                while (true) {
                    int[] n = gs.neighbor(r,c,dirs[d]); r=n[0]; c=n[1]; dist++;
                    if (!gs.valid(r,c)) break;
                    Minion t = gs.board[r][c].occupant;
                    if (t != null) {
                        if ((t.owner == minion.owner) == ally && dist < minDist) {
                            minDist = dist;
                            best = (long)dist * 10 + (d + 1);
                        }
                        break;
                    }
                }
            }
            return best;
        }
    }

    // TOKENIZER
    static List<String> tokenize(String src) {
        List<String> tokens = new ArrayList<>();
        Pattern p = Pattern.compile("(#.*)|([a-zA-Z_]\\w*)|(\\d+)|([+\\-*/%^(){}<>=])");
        Matcher m = p.matcher(src);
        while (m.find()) {
            if (m.group(1) != null) continue; // skip comments
            tokens.add(m.group());
        }
        return tokens;
    }

    // PARSER
    static class Parser {
        List<String> tokens; int pos;
        Parser(List<String> t){ tokens=t; pos=0; }

        Node parse() {
            List<Node> stmts = new ArrayList<>();
            while (pos < tokens.size() && !peek().equals("}")) stmts.add(stmt());
            return new BlockNode(stmts);
        }

        Node stmt() {
            String t = peek();
            if (t.equals("if"))    return parseIf();
            if (t.equals("while")) return parseWhile();
            if (t.equals("{"))     return parseBlock();
            if (pos+1 < tokens.size() && tokens.get(pos+1).equals("=")) return parseAssign();
            return parseAction();
        }

        Node parseIf() {
            eat("if"); eat("("); Expr c = expr(); eat(")");
            // consume optional "then"
            if (peek().equals("then")) eat("then");
            Node then = stmt();
            Node els = null;
            if (pos < tokens.size() && peek().equals("else")) { eat("else"); els = stmt(); }
            return new IfNode(c, then, els);
        }

        Node parseWhile() {
            eat("while"); eat("("); Expr c = expr(); eat(")");
            return new WhileNode(c, stmt());
        }

        Node parseBlock() {
            eat("{"); List<Node> s = new ArrayList<>();
            while (!peek().equals("}")) s.add(stmt());
            eat("}"); return new BlockNode(s);
        }

        Node parseAssign() {
            String name = next(); eat("="); return new AssignNode(name, expr());
        }

        Node parseAction() {
            String action = next();
            String dir = "up";
            Expr amount = null;
            if (!action.equals("done") && pos < tokens.size()) {
                String nx = peek();
                if (nx.matches("up|down|upleft|upright|downleft|downright")) {
                    dir = next();
                    // map right/left to nearest hex equivalent
                    if (dir.equals("right")) dir = "upright";
                    if (dir.equals("left"))  dir = "upleft";
                }
            }
            if (action.equals("shoot")) amount = expr();
            return new ActionNode(action, dir, amount);
        }

        // Expression precedence: comparison < additive < term < power < atom
        Expr expr() {
            Expr left = additive();
            while (pos < tokens.size() && (peek().equals(">") || peek().equals("<"))) {
                String op = next(); left = new BinNode(left, op, additive());
            }
            return left;
        }
        Expr additive() {
            Expr l = term();
            while (pos < tokens.size() && (peek().equals("+") || peek().equals("-"))) {
                String op = next(); l = new BinNode(l, op, term());
            }
            return l;
        }
        Expr term() {
            Expr l = power();
            while (pos < tokens.size() && (peek().equals("*")||peek().equals("/")||peek().equals("%"))) {
                String op = next(); l = new BinNode(l, op, power());
            }
            return l;
        }
        Expr power() {
            Expr l = atom();
            if (pos < tokens.size() && peek().equals("^")) { next(); return new BinNode(l,"^",power()); }
            return l;
        }
        Expr atom() {
            String t = peek();
            if (t.equals("ally"))     { next(); return new InfoNode("ally", null); }
            if (t.equals("opponent")) { next(); return new InfoNode("opponent", null); }
            if (t.equals("nearby"))   { next(); String d = next(); return new InfoNode("nearby", d); }
            t = next();
            if (t.matches("\\d+"))                    return new NumNode(Long.parseLong(t));
            if (t.matches("[a-zA-Z_][a-zA-Z0-9_]*")) return new VarNode(t);
            if (t.equals("(")) { Expr e = expr(); eat(")"); return e; }
            throw new RuntimeException("Unexpected token: " + t);
        }

        String peek() { return pos < tokens.size() ? tokens.get(pos) : ""; }
        String next() { return tokens.get(pos++); }
        void eat(String expected) {
            String got = next();
            if (!got.equals(expected)) throw new RuntimeException("Expected '" + expected + "' got '" + got + "'");
        }
    }

    // EVALUATOR
    static class Evaluator {
        boolean done = false;

        void run(Node node, Ctx ctx) {
            if (done || node == null) return;
            if (node instanceof ActionNode)  { doAction((ActionNode) node, ctx); }
            else if (node instanceof AssignNode) {
                AssignNode a = (AssignNode) node;
                ctx.set(a.name, a.expr.eval(ctx));
            }
            else if (node instanceof IfNode) {
                IfNode n = (IfNode) node;
                if (n.cond.eval(ctx) > 0) run(n.then, ctx);
                else if (n.els != null) run(n.els, ctx);
            }
            else if (node instanceof WhileNode) {
                WhileNode n = (WhileNode) node;
                int guard = 10000;
                while (!done && n.cond.eval(ctx) > 0 && guard-- > 0) run(n.body, ctx);
            }
            else if (node instanceof BlockNode) {
                for (Node s : ((BlockNode) node).stmts) { run(s, ctx); if (done) break; }
            }
        }

        void doAction(ActionNode n, Ctx ctx) {
            if ("done".equals(n.action)) { done = true; return; }
            Minion m = ctx.minion; GameState gs = ctx.gs; Player p = m.owner;
            if ("move".equals(n.action)) {
                int pr = m.row, pc = m.col;
                if (p.spend(1)) gs.move(m, n.dir);
                System.out.printf("    move %-10s (%d,%d)→(%d,%d)%n", n.dir, pr, pc, m.row, m.col);
                done = true;
            } else if ("shoot".equals(n.action)) {
                long exp = n.amount != null ? n.amount.eval(ctx) : 0;
                if (p.spend(exp + 1)) {
                    int[] tp = gs.neighbor(m.row, m.col, n.dir);
                    Hex th = gs.hex(tp[0], tp[1]);
                    if (th != null && th.occupant != null) {
                        long dmg = Math.max(1, exp - th.occupant.defense);
                        int hpBefore = th.occupant.hp;
                        th.occupant.damage((int) dmg);
                        System.out.printf("    shoot %-9s exp=%d dmg=%d  target hp %d→%d%n",
                                n.dir, exp, dmg, hpBefore, th.occupant.hp);
                        if (!th.occupant.isAlive()) { System.out.println("    *** target eliminated ***"); th.occupant = null; }
                    } else {
                        System.out.printf("    shoot %-9s exp=%d (no target)%n", n.dir, exp);
                    }
                } else {
                    System.out.printf("    shoot %-9s (budget insufficient)%n", n.dir);
                }
                done = true;
            }
        }
    }

    static void printBoard(GameState gs) {
        System.out.println();
        // column header
        System.out.print("     ");
        for (int c = 1; c <= 8; c++) System.out.printf("  col%-3d", c);
        System.out.println();

        final int HEX_W = 7, HALF = 3;
        int H = 26, W = 8*HEX_W + HALF + 10;
        char[][] cv = new char[H][W];
        for (char[] row : cv) Arrays.fill(row, ' ');

        for (int r = 1; r <= 8; r++) {
            for (int c = 1; c <= 8; c++) {
                boolean odd = (r % 2 != 0);
                int cx = (c-1)*HEX_W + (odd ? HALF : 0) + 3;
                int cy = (r-1)*3;

                // border
                sc(cv,cy,  cx-2,'/'); sc(cv,cy,  cx-1,'-'); sc(cv,cy,  cx,'-'); sc(cv,cy,  cx+2,'\\');
                sc(cv,cy+1,cx-3,'|');                                             sc(cv,cy+1,cx+3,'|');
                sc(cv,cy+2,cx-2,'\\');sc(cv,cy+2,cx-1,'-');sc(cv,cy+2,cx,'-'); sc(cv,cy+2,cx+2,'/');

                Hex hex = gs.board[r][c];
                Minion m = hex.occupant;
                if (m != null) {
                    ss(cv, cy,   cx-2, center(String.valueOf(m.hp), 5));
                    ss(cv, cy+1, cx-2, center("P"+m.owner.id, 5));
                } else if (hex.owner != null) {
                    ss(cv, cy+1, cx-1, "."+hex.owner.id+".");
                } else {
                    String lbl = r+","+c;
                    ss(cv, cy+1, cx - lbl.length()/2, lbl);
                }
            }
        }

        for (char[] row : cv) System.out.println(new String(row));
        System.out.println("  Legend: P1/P2 = minion (number above = HP)  .1./.2. = owned hex  r,c = empty");
        System.out.println();
    }

    static void sc(char[][] cv, int r, int x, char ch) {
        if (r>=0&&r<cv.length&&x>=0&&x<cv[r].length) cv[r][x]=ch;
    }
    static void ss(char[][] cv, int r, int x, String s) {
        for (int i=0;i<s.length();i++) sc(cv,r,x+i,s.charAt(i));
    }
    static String center(String s, int w) {
        if (s.length()>=w) return s.substring(0,w);
        int p=(w-s.length())/2;
        return " ".repeat(p)+s+" ".repeat(w-s.length()-p);
    }

    static void printStatus(GameState gs) {
        for (Player p : new Player[]{gs.p1, gs.p2}) {
            System.out.printf("  P%d | budget=%-8.0f |", p.id, p.budget);
            for (Minion m : p.minions)
                System.out.printf(" (%d,%d) hp=%d def=%d [%s] |",
                        m.row, m.col, m.hp, m.defense, m.isAlive()?"alive":"DEAD");
            System.out.println();
        }
    }

    static Scanner sc = new Scanner(System.in);

    public static void main(String[] args) {
        System.out.println("║        KOMBAT  Terminal          ║");
        System.out.println();

        GameState gs = new GameState();

        // ── setup ──
        System.out.println("=== Player 1 Setup ===");
        Minion m1 = setupMinion(gs, gs.p1, 1, 1);
        System.out.println();
        System.out.println("=== Player 2 Setup ===");
        Minion m2 = setupMinion(gs, gs.p2, 8, 8);
        System.out.println();

        // ── auto run ──
        System.out.println("=== Running... ===");
        printBoard(gs);
        printStatus(gs);

        for (int turn = 1; turn <= MAX_TURNS; turn++) {
            gs.turn = turn;
            gs.addTurnIncome(gs.p1);
            gs.addTurnIncome(gs.p2);

            System.out.println("── Turn " + turn + " ──");

            // 1. evaluate ทั้งสองฝั่งบน board
            Pending a1 = planMinion(gs, m1);
            Pending a2 = planMinion(gs, m2);

            // 2. apply พร้อมกัน: move ก่อน แล้ว shoot
            if ("move".equals(a1.type))  applyAction(gs, a1);
            if ("move".equals(a2.type))  applyAction(gs, a2);
            if ("shoot".equals(a1.type)) applyAction(gs, a1);
            if ("shoot".equals(a2.type)) applyAction(gs, a2);

            printBoard(gs);
            printStatus(gs);

            int w = winner(gs, turn);
            if (w != 0) { showWinner(w); return; }
        }

        System.out.println("Max turns reached.");
        showWinner(winner(gs, MAX_TURNS));
    }

    // ── setup minion + strategy ──
    static Minion setupMinion(GameState gs, Player p, int row, int col) {
        System.out.print("  Defense (default 5): ");
        String ds = sc.nextLine().trim();
        int defense = ds.isEmpty() ? 5 : Integer.parseInt(ds);

        System.out.println("  เลือก strategy:");
        System.out.println("  [a] Aggressive Rusher — วิ่งเข้าหา ยิงทุก budget");
        System.out.println("  [b] Cautious Sniper   — รักษาระยะ ยิงปานกลาง ถ้าใกล้ถอย");
        System.out.println("  [d] โหลดจากไฟล์: f /strategy.txt");
        System.out.println("  หรือพิมพ์ script เอง จบด้วย END");
        Node ast = readScript(p.id);

        Minion m = new Minion(p, defense, INIT_HP, ast);
        gs.place(p, m, row, col);
        System.out.println("  Spawned at (" + row + "," + col + ")  hp=" + INIT_HP + "  def=" + defense);
        return m;
    }

    // ── อ่าน script จนเจอ END ──
    static Node readScript(int pid) {
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        while (true) {
            System.out.print("  P" + pid + "> ");
            String line = sc.nextLine();
            if (first) {
                String t = line.trim().toLowerCase();
                if (t.equals("a")) { sb.append(STRATEGY_RUSHER);  System.out.println("  Using: Aggressive Rusher"); break; }
                if (t.equals("b")) { sb.append(STRATEGY_SNIPER);  System.out.println("  Using: Cautious Sniper");  break; }
                if (t.equals("d")) { sb.append(STRATEGY_DEFAULT); System.out.println("  Using: Default strategy"); break; }
                if (t.startsWith("f ")) {
                    String path = line.trim().substring(2).trim();
                    try {
                        sb.append(new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(path))));
                        System.out.println("  Loaded: " + path);
                        break;
                    } catch (Exception e) {
                        System.out.println("  Cannot read file: " + e.getMessage());
                    }
                }
            }
            first = false;
            if (line.trim().equalsIgnoreCase("END")) break;
            sb.append(line).append("\n");
        }
        try {
            Node ast = new Parser(tokenize(sb.toString())).parse();
            System.out.println("  Script OK.");
            return ast;
        } catch (Exception e) {
            System.out.println("  Parse error: " + e.getMessage() + " — using empty script.");
            return new BlockNode(new ArrayList<>());
        }
    }

    static final String STRATEGY_RUSHER =
            "# Aggressive Rusher: rush in, spend all budget on attack\n" +
                    "loc = opponent\n" +
                    "if (loc / 10 - 1) then {\n" +                 // dist > 1 → move closer
                    "  if (loc % 10 - 5) then move downleft\n" +
                    "  else if (loc % 10 - 4) then move down\n" +
                    "  else if (loc % 10 - 3) then move downright\n" +
                    "  else if (loc % 10 - 2) then move upright\n" +
                    "  else if (loc % 10 - 1) then move up\n" +
                    "  else move upleft\n" +
                    "} else if (loc) then {\n" +                   // dist == 1 → shoot all budget
                    "  spend = Budget - 1\n" +
                    "  if (loc % 10 - 5) then shoot upleft spend\n" +
                    "  else if (loc % 10 - 4) then shoot downleft spend\n" +
                    "  else if (loc % 10 - 3) then shoot down spend\n" +
                    "  else if (loc % 10 - 2) then shoot downright spend\n" +
                    "  else if (loc % 10 - 1) then shoot upright spend\n" +
                    "  else shoot up spend\n" +
                    "} else {\n" +                                 // ไม่เห็น → เดินข้ามแผนที่
                    "  if (row - 4) then move down\n" +
                    "  else move downright\n" +
                    "}\n";

    static final String STRATEGY_SNIPER =
            "# Cautious Sniper: maintain distance 2, shoot steadily, retreat if cornered\n" +
                    "loc = opponent\n" +
                    "dist = loc / 10\n" +
                    "dir = loc % 10\n" +
                    "if (dist - 2) then {\n" +                    // dist > 2 → เดินเข้าหา
                    "  if (dir - 5) then move downleft\n" +
                    "  else if (dir - 4) then move down\n" +
                    "  else if (dir - 3) then move downright\n" +
                    "  else if (dir - 2) then move upright\n" +
                    "  else if (dir - 1) then move up\n" +
                    "  else move upleft\n" +
                    "} else if (dist - 1) then {\n" +             // dist == 2 → ยิง 200
                    "  if (Budget - 201) then {\n" +
                    "    if (dir - 5) then shoot upleft 200\n" +
                    "    else if (dir - 4) then shoot downleft 200\n" +
                    "    else if (dir - 3) then shoot down 200\n" +
                    "    else if (dir - 2) then shoot downright 200\n" +
                    "    else if (dir - 1) then shoot upright 200\n" +
                    "    else shoot up 200\n" +
                    "  } else done\n" +
                    "} else if (loc) then {\n" +                  // dist == 1 → ถอยหนีทิศตรงข้าม
                    "  if (dir - 5) then move upright\n" +
                    "  else if (dir - 4) then move up\n" +
                    "  else if (dir - 3) then move upleft\n" +
                    "  else if (dir - 2) then move downleft\n" +
                    "  else if (dir - 1) then move downright\n" +
                    "  else move down\n" +
                    "} else {\n" +                                // ไม่เห็น → เดินตัดแผนที่
                    "  if (row - 5) then move up\n" +
                    "  else move upleft\n" +
                    "}\n";


    static final String STRATEGY_DEFAULT =
            "t = t + 1\n" +
                    "m = 0\n" +
                    "while (3 - m) {\n" +
                    "  if (Budget - 100) then {} else done\n" +
                    "  opponentLoc = opponent\n" +
                    "  if (opponentLoc / 10 - 1)\n" +
                    "  then\n" +
                    "    if (opponentLoc % 10 - 5) then move upleft\n" +
                    "    else if (opponentLoc % 10 - 4) then move downleft\n" +
                    "    else if (opponentLoc % 10 - 3) then move down\n" +
                    "    else if (opponentLoc % 10 - 2) then move downright\n" +
                    "    else if (opponentLoc % 10 - 1) then move upright\n" +
                    "    else move up\n" +
                    "  else if (opponentLoc)\n" +
                    "  then\n" +
                    "    if (opponentLoc % 10 - 5) then {\n" +
                    "      cost = 10 ^ (nearby upleft % 100 + 1)\n" +
                    "      if (Budget - cost) then shoot upleft cost else {}\n" +
                    "    }\n" +
                    "    else if (opponentLoc % 10 - 4) then {\n" +
                    "      cost = 10 ^ (nearby downleft % 100 + 1)\n" +
                    "      if (Budget - cost) then shoot downleft cost else {}\n" +
                    "    }\n" +
                    "    else if (opponentLoc % 10 - 3) then {\n" +
                    "      cost = 10 ^ (nearby down % 100 + 1)\n" +
                    "      if (Budget - cost) then shoot down cost else {}\n" +
                    "    }\n" +
                    "    else if (opponentLoc % 10 - 2) then {\n" +
                    "      cost = 10 ^ (nearby downright % 100 + 1)\n" +
                    "      if (Budget - cost) then shoot downright cost else {}\n" +
                    "    }\n" +
                    "    else if (opponentLoc % 10 - 1) then {\n" +
                    "      cost = 10 ^ (nearby upright % 100 + 1)\n" +
                    "      if (Budget - cost) then shoot upright cost else {}\n" +
                    "    }\n" +
                    "    else {\n" +
                    "      cost = 10 ^ (nearby up % 100 + 1)\n" +
                    "      if (Budget - cost) then shoot up cost else {}\n" +
                    "    }\n" +
                    "  else {\n" +
                    "    try = 0\n" +
                    "    while (3 - try) {\n" +
                    "      success = 1\n" +
                    "      dir = random % 6\n" +
                    "      # (nearby <dir> % 10 + 1) ^ 2 is positive if adjacent cell in <dir> has no ally\n" +
                    "      if ((dir - 4) * (nearby upleft % 10 + 1) ^ 2) then move upleft\n" +
                    "      else if ((dir - 3) * (nearby downleft % 10 + 1) ^ 2) then move downleft\n" +
                    "      else if ((dir - 2) * (nearby down % 10 + 1) ^ 2) then move down\n" +
                    "      else if ((dir - 1) * (nearby downright % 10 + 1) ^ 2) then move downright\n" +
                    "      else if (dir * (nearby upright % 10 + 1) ^ 2) then move upright\n" +
                    "      else if ((nearby up % 10 + 1) ^ 2) then move up\n" +
                    "      else success = 0\n" +
                    "      if (success) then try = 3 else try = try + 1\n" +
                    "    }\n" +
                    "    m = m + 1\n" +
                    "  }\n" +
                    "}\n";

    // ── รัน strategy ของ minion 1 turn ──
    static void runMinion(GameState gs, Minion m, int pid) {
        // kept for compatibility — not used in simultaneous mode
    }

    // ── pending action ──
    static class Pending {
        String type; String dir; long exp; Minion actor;
        Pending(String type, String dir, long exp, Minion actor) {
            this.type=type; this.dir=dir; this.exp=exp; this.actor=actor;
        }
    }

    // evaluate strategy บน board ปัจจุบัน → ได้ action โดยไม่แก้ board
    static Pending planMinion(GameState gs, Minion m) {
        if (!m.isAlive()) return new Pending("none", null, 0, m);
        Pending[] result = { new Pending("none", null, 0, m) };
        Evaluator ev = new Evaluator() {
            @Override void doAction(ActionNode n, Ctx ctx) {
                if ("done".equals(n.action)) { done = true; return; }
                if ("move".equals(n.action)) {
                    result[0] = new Pending("move", n.dir, 0, m);
                } else if ("shoot".equals(n.action)) {
                    long exp = n.amount != null ? n.amount.eval(ctx) : 0;
                    result[0] = new Pending("shoot", n.dir, exp, m);
                }
                done = true;
            }
        };
        ev.run(m.strategy, new Ctx(m, gs));
        return result[0];
    }

    // apply action จริงๆ บน board
    static void applyAction(GameState gs, Pending a) {
        Minion m = a.actor;
        if (!m.isAlive()) return;
        Player p = m.owner;
        if ("move".equals(a.type)) {
            int pr = m.row, pc = m.col;
            if (p.spend(1)) gs.move(m, a.dir);
            System.out.printf("  P%d  move %-10s (%d,%d)→(%d,%d)%n", p.id, a.dir, pr, pc, m.row, m.col);
        } else if ("shoot".equals(a.type)) {
            if (p.spend(a.exp + 1)) {
                int[] tp = gs.neighbor(m.row, m.col, a.dir);
                Hex th = gs.hex(tp[0], tp[1]);
                if (th != null && th.occupant != null) {
                    long dmg = Math.max(1, a.exp - th.occupant.defense);
                    int hpBefore = th.occupant.hp;
                    th.occupant.damage((int) dmg);
                    System.out.printf("  P%d  shoot %-9s exp=%d dmg=%d  target hp %d→%d%n",
                            p.id, a.dir, a.exp, dmg, hpBefore, th.occupant.hp);
                    if (!th.occupant.isAlive()) {
                        System.out.printf("  *** P%d minion eliminated ***%n", th.occupant.owner.id);
                        th.occupant = null;
                    }
                } else {
                    System.out.printf("  P%d  shoot %-9s exp=%d (no target)%n", p.id, a.dir, a.exp);
                }
            } else {
                System.out.printf("  P%d  shoot (budget insufficient)%n", p.id);
            }
        }
    }

    static void showWinner(int w) {
        System.out.println();
        System.out.println("╔══════════════════════════════════╗");
        if (w == 3)
            System.out.println("║         IT'S A DRAW!             ║");
        else
            System.out.println("║      Player " + w + " Wins!  \uD83C\uDFC6            ║");
        System.out.println("╚══════════════════════════════════╝");
    }

    static int winner(GameState gs, int turn) {
        long a1 = gs.p1.aliveCount(), a2 = gs.p2.aliveCount();
        if (turn > 1) {
            if (a1==0 && a2==0) return 3;
            if (a1==0) return 2;
            if (a2==0) return 1;
        }
        if (turn >= MAX_TURNS) {
            if (a1>a2) return 1; if (a2>a1) return 2;
            long h1=gs.p1.totalHp(), h2=gs.p2.totalHp();
            if (h1>h2) return 1; if (h2>h1) return 2;
            if (gs.p1.budget>gs.p2.budget) return 1;
            if (gs.p2.budget>gs.p1.budget) return 2;
            return 1; // P1 wins tiebreak by spec
        }
        return 0;
    }
}