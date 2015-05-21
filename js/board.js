/* exported BOARD */

var BOARD = function board_init(el, options)
{
    "use strict";
    
    var board,
        board_details = {
            ranks: 8,
            files: 8,
        },
        squares,
        hover_squares,
        pos,
        colors = ["blue", "red", "green", "yellow", "teal", "orange", "purple", "pink"],
        cur_color = 0,
        capturing_clicks,
        legal_moves;
    
    function num_to_alpha(num)
    {
        return "abcdefgh"[num];
    }
    
    function error(str)
    {
        str = str || "Unknown error";
        
        alert("An error occured.\n" + str);
        throw new Error(str);
    }
    
    function check_el(el)
    {
        if (typeof el === "string") {
            return document.getElementById(el);
        }
        return el;
    }
    
    function get_init_pos()
    {
        ///NOTE: I made this a function so that we could pass other arguments, like chess varients.
        return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        //return "6R1/1pp5/5k2/p1b4r/P1P2p2/1P5r/4R2P/7K w - - 0 39";
    }
    
    function remove_square_focus(x, y)
    {
        if (squares[y][x].focus_color) {
            squares[y][x].classList.remove("focus_square_" + squares[y][x].focus_color);
            squares[y][x].classList.remove("focusSquare");
            delete squares[y][x].focus_color;
        }
    }
    
    function focus_square(x, y, color)
    {
        remove_square_focus(x, y);
        if (color && colors.indexOf(color) > -1) {
            squares[y][x].focus_color = color;
            squares[y][x].classList.add("focus_square_" + color);
            squares[y][x].classList.add("focusSquare");
        }
    }
    
    function clear_focuses()
    {
        delete board.clicked_piece;
        squares.forEach(function oneach(file, y)
        {
            file.forEach(function oneach(sq, x)
            {
                remove_square_focus(x, y);
            });
        });
    }
    
    function remove_highlight(x, y)
    {
        if (hover_squares[y][x].highlight_color) {
            hover_squares[y][x].classList.remove(hover_squares[y][x].highlight_color);
            delete hover_squares[y][x].highlight_color;
        }
    }
    
    function highlight_square(x, y, color)
    {
        remove_highlight(x, y);
        if (color && colors.indexOf(color) > -1) {
            hover_squares[y][x].highlight_color = color;
            hover_squares[y][x].classList.add(color);
        }
    }
    
    function clear_highlights()
    {
        hover_squares.forEach(function oneach(file, y)
        {
            file.forEach(function oneach(sq, x)
            {
                remove_highlight(x, y);
            });
        });
    }
    
    /**
     * Ctrl click to set/remove colors.
     * Ctrl Left/Right to change colors.
     * Ctrl Non-left click to (only/always) remove colors.
     * Ctrl Space to clear board of highlights.
     */
    function hover_square_click_maker(x, y)
    {
        return function (e)
        {
            var new_color,
                square;
            
            if (e.ctrlKey) {
                /// Highlight the sqaure.
                new_color = colors[cur_color];
                if (is_left_click(e)) {
                    if (hover_squares[y][x].highlight_color === new_color) {
                        remove_highlight(x, y);
                    } else {
                        highlight_square(x, y, new_color);
                    }
                } else {
                    remove_highlight(x, y);
                    e.preventDefault();
                }
            } else if (board.clicked_piece) {
                ///TODO: Make sure the move is valid.
                /// Move to the square.
                square = {rank: y, file: x};
                make_move(board.clicked_piece.piece, square, get_move(board.clicked_piece.piece, square), is_promoting(board.clicked_piece.piece, square));
            }
        };
    }
    
    function make_hover_square(x, y)
    {
        var el = document.createElement("div");
        
        el.classList.add("hoverSquare");
        el.classList.add("rank" + y);
        el.classList.add("file" + x);
        
        el.addEventListener("click", hover_square_click_maker(x, y));
        
        return el;
    }
    
    
    function get_rank_file_from_str(str)
    {
        return {rank: str[1] - 1, file: str.charCodeAt(0) - 97};
    }
    
    function remove_dot(x, y)
    {
        if (hover_squares[y][x].dot_color) {
            hover_squares[y][x].classList.remove("dot_square_" + hover_squares[y][x].dot_color);
            hover_squares[y][x].classList.remove("dotSquare");
            delete hover_squares[y][x].dot_color;
        }
    }
    
    function clear_dots()
    {
        hover_squares.forEach(function oneach(file, y)
        {
            file.forEach(function oneach(sq, x)
            {
                remove_dot(x, y);
            });
        });
    }
    
    function add_dot(x, y, color)
    {
        remove_dot(x, y);
        
        if (color && colors.indexOf(color) > -1) {
            hover_squares[y][x].dot_color = color;
            hover_squares[y][x].classList.add("dot_square_" + color);
            hover_squares[y][x].classList.add("dotSquare");
        }
    }
    
    function add_clickabe_square(move_data)
    {
        if (board.clicked_piece) {
            if (!board.clicked_piece.clickable_squares) {
                board.clicked_piece.clickable_squares = [];
            }
            board.clicked_piece.clickable_squares.push(move_data);
        }
    }
    
    function show_legal_moves(piece)
    {
        var start_sq = get_file_letter(piece.file) + (piece.rank + 1);
        
        clear_dots();
        
        if (legal_moves && legal_moves.uci) {
            legal_moves.uci.forEach(function oneach(move, i)
            {
                var move_data,
                    color;
                
                if (move.indexOf(start_sq) === 0) {
                    move_data = get_rank_file_from_str(move.substr(2));
                    ///NOTE: We can't use get_piece_from_rank_file(move_data.rank, move_data.file) because it won't find en passant.
                    if (legal_moves.san[i].indexOf("x") === -1) {
                        color = "green";
                    } else {
                        color = "red"
                    }
                    add_dot(move_data.file, move_data.rank, color);
                    add_clickabe_square(move_data);
                }
            });
        }
    }
    
    function make_square(x, y)
    {
        var el = document.createElement("div");
        
        el.classList.add("square");
        el.classList.add("rank" + y);
        el.classList.add("file" + x);
        
        if ((x + y) % 2) {
            el.classList.add("light");
        } else {
            el.classList.add("dark");
        }
        
        return el;
    }
    
    function make_rank(num)
    {
        var el = document.createElement("div");
        
        el.classList.add("rank");
        el.classList.add("rank" + num);
        
        return el;
    }
    
    function size_board(w, h)
    {
        board_details.width  = parseFloat(w);
        board_details.height = parseFloat(h);
        
        board.el.style.width  = board_details.width  + "px";
        board.el.style.height = board_details.height + "px";
    }
    
    function make_board_num(num)
    {
        var el = document.createElement("div");
        
        el.classList.add("notation");
        el.classList.add("num");
        el.textContent = num + 1;
        
        return el;
    }
    
    function get_file_letter(num)
    {
        return String.fromCharCode(97 + num);
    }
    
    function make_board_letter(num)
    {
        var el = document.createElement("div");
        
        el.classList.add("notation");
        el.classList.add("letter");
        el.textContent = get_file_letter(num);
        
        return el;
    }
    
    function switch_turn()
    {
        if (board.turn === "w") {
            board.turn = "b";
        } else {
            board.turn = "w";
        }
        if (board.onswitch) {
            board.onswitch();
        }
    }
    
    function create_board(el, dim)
    {
        var x,
            y,
            cur_rank;
        
        if (el) {
            board.el = check_el(el);
        }
        
        board.el.innerHTML = "";
        
        /// Prevent I beam cursor.
        board.el.addEventListener("mousedown", function onboard_mouse_down(e)
        {
            e.preventDefault();
        });
        
        if (dim) {
            size_board(dim.w, dim.h);
        } else {
            size_board(600, 600);
        }
        
        squares = [];
        hover_squares = [];
        
        for (y = board_details.ranks - 1; y >= 0; y -= 1) {
            squares[y] = [];
            hover_squares[y] = [];
            for (x = 0; x < board_details.files; x += 1) {
                squares[y][x] = make_square(x, y);
                hover_squares[y][x] = make_hover_square(x, y);
                if (x === 0) {
                    cur_rank = make_rank(y);
                    board.el.appendChild(cur_rank);
                    squares[y][x].appendChild(make_board_num(y));
                }
                if (y === 0) {
                    squares[y][x].appendChild(make_board_letter(x));
                }
                squares[y][x].appendChild(hover_squares[y][x]);
                cur_rank.appendChild(squares[y][x]);
            }
        }
        
        board.el.classList.add("chess_board");
        
        return board;
    }
    
    function load_pieces_from_start(fen)
    {
        var fen_pieces = fen.match(/^\S+/),
            rank = 7,
            file = 0,
            id = 0;
        
        if (board.pieces) {
            board.pieces.forEach(function oneach(piece)
            {
                if (piece.el && piece.el.parentNode) {
                    piece.el.parentNode.removeChild(piece.el);
                }
                
            });
        }
        board.pieces = [];
        
        if (!fen_pieces) {
            error("Bad position: " + pos);
        }
        
        fen_pieces[0].split("").forEach(function oneach(letter)
        {
            var piece;
            
            if (letter === "/") {
                rank -= 1;
                file = 0;
            } else if (/\d/.test(letter)) {
                file += parseInt(letter, 10);
            } else {
                /// It's a piece.
                piece = {};
                piece.type = letter.toLowerCase();
                /// Is it white?
                if (/[A-Z]/.test(letter)) {
                    piece.color = "w";
                } else {
                    piece.color = "b";
                }
                piece.rank = rank;
                piece.file = file;
                piece.id = id;
                board.pieces[board.pieces.length] = piece;
                file += 1;
                id += 1;
            }
        });
    }
    
    function is_piece_moveable(piece)
    {
        return board.mode === "setup" || (board.mode === "play" && board.turn === piece.color && board.players[board.turn].type === "human");
    }
    
    function is_left_click(e)
    {
        return (e.which || (e || window.event).button) === 1;
    }
    
    function fix_touch_event(e)
    {
        if (e.changedTouches && e.changedTouches[0]) {
            e.clientX = e.changedTouches[0].pageX;
            e.clientY = e.changedTouches[0].pageY;
        }
    }
    
    function focus_piece_for_moving(piece)
    {
        board.clicked_piece = {piece: piece};
        focus_square(piece.file, piece.rank, "green");
        show_legal_moves(piece);
    }
    
    function add_piece_events(piece)
    {
        function onpiece_mouse_down(e)
        {
            ///TODO: Test and make sure it works on touch devices.
            if ((e.type === "touchstart" || is_left_click(e)) && is_piece_moveable(piece)) {
                fix_touch_event(e);
                board.dragging = {};
                board.dragging.piece = piece;
                board.dragging.origin = {x: e.clientX, y: e.clientY};
                board.dragging.box = piece.el.getBoundingClientRect();
                
                board.el.classList.add("dragging");
                board.dragging.piece.el.classList.add("dragging");
            }
            if (e.preventDefault) {
                /// Prevent the cursor from becoming an I beam.
                e.preventDefault();
            }
            
            if (board.clicked_piece && board.clicked_piece.piece) {
                remove_square_focus(board.clicked_piece.piece.file, board.clicked_piece.piece.rank);
                clear_dots();
                /// If the king was previously selected, we want to refocus it.
                if (board.checked_king) {
                    focus_square(board.checked_king.file, board.checked_king.rank, "red");
                }
            }
            
            if (is_piece_moveable(piece)) {
                focus_piece_for_moving(piece);
            }
        }
        
        piece.el.addEventListener("mousedown", onpiece_mouse_down);
        
        piece.el.addEventListener("touchstart", onpiece_mouse_down);
    }
    
    function prefix_css(el, prop, value)
    {
        el.style[prop] = value;
        el.style["Webkit" + prop[0].toUpperCase() + prop.substr(1)] = value;
        el.style["O" + prop[0].toUpperCase() + prop.substr(1)] = value;
        el.style["MS" + prop[0].toUpperCase() + prop.substr(1)] = value;
        el.style["Moz" + prop[0].toUpperCase() + prop.substr(1)] = value;
    }
    
    function onmousemove(e)
    {
        /// If the user held the ctrl button and then clicked off of the browser, it will still be marked as capturing. We remove that here.
        if (capturing_clicks && !e.ctrlKey) {
            stop_capturing_clicks();
        }
        if (board.dragging && board.dragging.piece) {
            fix_touch_event(e);
            prefix_css(board.dragging.piece.el, "transform", "translate(" + (e.clientX - board.dragging.origin.x) + "px," + (e.clientY - board.dragging.origin.y) + "px)")
        }
    }
    
    function get_dragging_hovering_square(e)
    {
        fix_touch_event(e);
        var el,
            match,
            square = {},
            rank_m,
            file_m,
            /// Use the position of the middle of the piece being dragged, not necessarily the mouse cursor.
            x = e.clientX + ((board.dragging.box.left + Math.round(board.dragging.box.width / 2)) - board.dragging.origin.x),
            y = e.clientY + ((board.dragging.box.top + Math.round(board.dragging.box.height / 2)) - board.dragging.origin.y);
        
        el = document.elementFromPoint(x, y);
        
        if (el && el.className && el.classList.contains("square") || el.classList.contains("hoverSquare")) {
            rank_m = el.className.match(/rank(\d+)/);
            file_m = el.className.match(/file(\d+)/);
            
            if (rank_m) {
                square.rank = parseInt(rank_m[1], 10);
            }
            if (file_m) {
                square.file = parseInt(file_m[1], 10);
            }
        }
        if (!isNaN(square.rank) && !isNaN(square.file)) {
            square.el = el;
            return square;
        }
        
    }
    
    function is_legal_move(uci)
    {
        if (!legal_moves || !legal_moves.uci) {
            return false;
        }
        
        return legal_moves.uci.indexOf(uci) > -1;
    }
    
    function get_move(starting, ending)
    {
        var str;
        if (starting && ending) {
            str = get_file_letter(starting.file) + (parseInt(starting.rank, 10) + 1) + get_file_letter(ending.file) + (parseInt(ending.rank, 10) + 1);
            if (is_promoting(starting, ending)) {
                str += "q"; /// We just add something to make sure it's a legal move. We'll ask the user later what he actually wants to promote to.
            }
        }
        return str;
    }
    
    function create_promotion_icon(which, piece, cb)
    {
        var icon = document.createElement("div");
        
        icon.addEventListener("click", function onclick()
        {
            cb(which);
        });
        
        /// In play mode, we can go with the color; in setup mode, we need to get the color from the piece.
        icon.style.backgroundImage = get_piece_img({color: board.mode === "play" ? board.turn : piece.color, type: which});
        
        icon.classList.add("promotion_icon");
        
        return icon;
    }
    
    function promotion_prompt(piece, cb)
    {
        var mod_win = document.createElement("div"),
            text_el = document.createElement("div"),
            old_mode = board.mode;
        
        mod_win.classList.add("board_modular_window");
        
        function close_window()
        {
            document.body.removeChild(mod_win);
            delete board.modular_window_close;
        }
        
        function onselect(which)
        {
            board.mode = old_mode;
            close_window();
            cb(which);
        }
        
        text_el.textContent = "Promote to";
        text_el.classList.add("promotion_text");
        
        mod_win.appendChild(text_el);
        
        mod_win.appendChild(create_promotion_icon("q", piece, onselect));
        mod_win.appendChild(create_promotion_icon("r", piece, onselect));
        mod_win.appendChild(create_promotion_icon("b", piece, onselect));
        mod_win.appendChild(create_promotion_icon("n", piece, onselect));
        
        document.body.appendChild(mod_win);
        board.mode = "waiting_for_modular_window";
        board.modular_window_close = close_window;
    }
    
    function report_move(uci, promoting, piece, cb)
    {
        /// We make it async because of promotion.
        function record()
        {
            legal_moves = null;
            
            if (board.mode === "play" && board.onmove) {
                track_move(uci);
                board.onmove(uci);
            }
            
            if (cb) {
                cb(uci);
            }
        }
        
        if (promoting) {
            promotion_prompt(piece, function onres(answer)
            {
                ///NOTE: The uci move already includes a promotion to queen to make it a valid move. We need to remove this and replace it with the desired promotion.
                uci = uci.substr(0, 4) + answer;
                record();
            });
        } else {
            setTimeout(record, 10);
        }
    }
    
    function set_piece_pos(piece, square)
    {
        if (!piece || !piece.el || !piece.el.style || !square) {
            return;
        }
        
        piece.el.style.top = -(square.rank * 100) + "%";
        piece.el.style.bottom = (square.rank * 100) + "%";
        
        piece.el.style.left = (square.file * 100) + "%";
        piece.el.style.right = -(square.file * 100) + "%";
        
        piece.rank = square.rank;
        piece.file = square.file;
    }
    
    function get_san(uci)
    {
        if (!legal_moves || !legal_moves.uci || !legal_moves.san) {
            return;
        }
        
        return legal_moves.san[legal_moves.uci.indexOf(uci)];
    }
    
    function promote_piece(piece, uci)
    {
        if (piece && uci.length === 5 && /[qrbn]/.test(uci[4])) {
            piece.type = uci[4];
            piece.el.style.backgroundImage = get_piece_img(piece);
        }
    }
    
    function move_piece(piece, square, uci)
    {
        var captured_piece,
            rook,
            san = get_san(uci),
            rook_rank = board.turn === "w" ? 0 : 7; ///TODO: Use board_details.ranks
        
        if (!piece || !square || !uci) {
            return false;
        }
        
        ///NOTE: This does not find en passant captures. See below.
        captured_piece = get_piece_from_rank_file(square.rank, square.file);
        
        if (board.mode === "play") {
            /// Indicate that the board has been changed; it is not in the inital starting position.
            board.messy = true;
            
            /// En passant
            if (!captured_piece && piece.type === "p" && piece.file !== square.file && ((piece.color === "w" && square.rank === board_details.ranks - 3) || (piece.color === "b" && square.rank === 2))) {
                captured_piece = get_piece_from_rank_file(piece.rank, square.file);
            }
            
            if (captured_piece && captured_piece.id !== piece.id) {
                capture(captured_piece);
            }
            
            /// Is it castling?
            if (san === "O-O") { /// Kingside castle
                rook = get_piece_from_rank_file(rook_rank, board_details.files - 1);
                set_piece_pos(rook, {rank: rook_rank, file: board_details.files - 3});
            } else if (san === "O-O-O") { /// Queenside castle
                rook = get_piece_from_rank_file(rook_rank, 0);
                set_piece_pos(rook, {rank: rook_rank, file: 3});
            }
        } else if (board.mode === "setup" && captured_piece) {
            /// The pieces should swap places.
            set_piece_pos(captured_piece, piece);
            
            if (captured_piece.type === "p" && (captured_piece.rank === 0 || captured_piece.rank === board_details.ranks - 1)) {
                promotion_prompt(captured_piece, function onres(answer)
                {
                    promote_piece(captured_piece, num_to_alpha(square.file) + square.rank + num_to_alpha(piece.file) + piece.rank + answer);
                });
            }
        }
        
        /// Make sure to change the rank and file after checking for a capured piece so that you don't capture yourself.
        set_piece_pos(piece, square);
    }
    
    function is_promoting(piece, square)
    {
        if (!piece || !square) {
            return;
        }
        
        return piece.type === "p" && square.rank % (board_details.ranks - 1) === 0;
    }
    
    function remove_piece(piece)
    {
        var i;
        
        for (i = board.pieces.length - 1; i >= 0; i -= 1) {
            if (piece.id === board.pieces[i].id) {
                G.array_remove(board.pieces, i);
                /// Make it fade out.
                piece.el.classList.add("captured");
                setTimeout(function ()
                {
                    piece.el.parentNode.removeChild(piece.el);
                }, 2000);
                return;
            }
        }
    }
    
    function make_move(piece, square, uci, promoting)
    {
        clear_board_extras();
        move_piece(piece, square, uci);
        report_move(uci, promoting, piece, function onreport(finalized_uci)
        {
            ///NOTE: Since this is async, we need to store which piece was moved.
            promote_piece(piece, finalized_uci);
        });
    }
    
    function onmouseup(e)
    {
        var square,
            uci,
            promoting;
        
        if (board.dragging && board.dragging.piece) {
            square = get_dragging_hovering_square(e);
            promoting = is_promoting(board.dragging.piece, square);
            
            uci = get_move(board.dragging.piece, square);
            
            if (square && (board.mode === "setup" || is_legal_move(uci))) {
                make_move(board.dragging.piece, square, uci, promoting);
                /*
                clear_board_extras();
                //clear_focuses();
                //clear_dots();
                piece_storage = board.dragging.piece;
                move_piece(board.dragging.piece, square, uci);
                report_move(uci, promoting, board.dragging.piece, function onreport(finalized_uci)
                {
                    ///NOTE: Since this is async, we need to store which piece was moved.
                    promote_piece(piece_storage, finalized_uci);
                });
                */
            } else {
                /// Snap back.
                if (board.mode === "setup") {
                    remove_piece(board.dragging.piece);
                    /// We need to remove "dragging" to make the transitions work again.
                    board.dragging.piece.el.classList.remove("dragging");
                    delete board.dragging.piece;
                }
            }
            
            /// If it wasn't deleted
            if (board.dragging.piece) {
                prefix_css(board.dragging.piece.el, "transform", "none");
                board.dragging.piece.el.classList.remove("dragging");
            }
            board.el.classList.remove("dragging");
            
            delete board.dragging;
        }
    }
    
    function get_piece_img(piece)
    {
        return "url(\"" + encodeURI("img/pieces/" + board.theme + "/" + piece.color + piece.type + (board.theme_ext || ".svg")) + "\")";
    }
    
    function clear_board_extras()
    {
        clear_highlights();
        clear_focuses();
        clear_dots();
    }
    
    function set_board(fen)
    {
        fen = fen || get_init_pos();
        
        load_pieces_from_start(fen);
        
        board.pieces.forEach(function oneach(piece)
        {
            if (!piece.el) {
                piece.el = document.createElement("div");
                
                piece.el.classList.add("piece");
                
                piece.el.style.backgroundImage = get_piece_img(piece)
                
                add_piece_events(piece);
            }
            
            /// We just put them all in the bottom left corner and move the position.
            squares[0][0].appendChild(piece.el);
            set_piece_pos(piece, {rank: piece.rank, file: piece.file});
        });
        
        clear_board_extras();
        
        board.turn = "w";
        board.moves = [];
        board.messy = false;
    }
    
    function wait()
    {
        board.mode = "wait";
        board.el.classList.add("waiting");
        board.el.classList.remove("settingUp");
        board.el.classList.remove("playing");
    }
    
    function play()
    {
        board.mode = "play";
        board.el.classList.remove("waiting");
        board.el.classList.remove("settingUp");
        board.el.classList.add("playing");
    }
    
    function enable_setup()
    {
        board.mode = "setup";
        board.el.classList.remove("waiting");
        board.el.classList.remove("playing");
        board.el.classList.add("settingUp");
    }
    
    function get_piece_from_rank_file(rank, file)
    {
        var i;
        
        rank = parseInt(rank, 10);
        file = parseInt(file, 10);
        
        for (i = board.pieces.length - 1; i >= 0; i -= 1) {
            if (!board.pieces[i].captured && board.pieces[i].rank === rank && board.pieces[i].file === file) {
                return board.pieces[i];
            }
        }
    }
    
    function split_uci(uci)
    {
        var positions = {
            starting: {
                file: uci.charCodeAt(0) - 97,
                rank: parseInt(uci[1], 10) - 1
            },
            ending: {
                file: uci.charCodeAt(2) - 97,
                rank: parseInt(uci[3], 10) - 1
            }
        };
        
        if (uci.length === 5) {
            positions.promote_to = uci[4];
        }
        
        return positions;
    }
    
    function capture(piece)
    {
        piece.captured = true;
        piece.el.classList.add("captured");
    }
    
    function move_piece_uci(uci)
    {
        var positions = split_uci(uci),
            piece,
            ending_square;
        
        ending_square = {
            el: squares[positions.ending.rank][positions.ending.file],
            rank: positions.ending.rank,
            file: positions.ending.file
        };
        
        piece = get_piece_from_rank_file(positions.starting.rank, positions.starting.file);
        
        if (piece) {
            move_piece(piece, ending_square, uci);
            promote_piece(piece, uci);
        }
    }
    
    function track_move(uci)
    {
        board.moves.push(uci);
        switch_turn();
    }
    
    function move(uci)
    {
        move_piece_uci(uci);
        track_move(uci);
    }
    
    function onkeydown(e)
    {
        if (e.ctrlKey) {
            board.el.classList.add("catchClicks");
            capturing_clicks = true;
            if (e.keyCode === 39) { /// Right
                cur_color += 1;
                if (cur_color >= colors.length) {
                    cur_color = 0;
                }
            } else if (e.keyCode === 37) { /// Left
                cur_color -= 1;
                if (cur_color < 0) {
                    cur_color = colors.length - 1;
                }
            } else if (e.keyCode === 32) { /// Space
                clear_highlights();
            }
        }
    }
    
    function stop_capturing_clicks()
    {
        board.el.classList.remove("catchClicks");
        capturing_clicks = false;
    }
    
    function onkeyup(e)
    {
        if (!e.ctrlKey) {
            stop_capturing_clicks();
        }
    }
    
    function get_fen(full)
    {
        var ranks = [],
            i,
            j,
            fen = "";
        
        board.pieces.forEach(function (piece)
        {
            if (!piece.captured) {
                if (!ranks[piece.rank]) {
                    ranks[piece.rank] = [];
                }
                ranks[piece.rank][piece.file] = piece.type;
                if (piece.color === "w") {
                    ranks[piece.rank][piece.file] = ranks[piece.rank][piece.file].toUpperCase();
                }
            }
        });
        
        /// Start with the last rank.
        for (i = board_details.ranks - 1; i >= 0; i -= 1) {
            if (ranks[i]) {
                for (j = 0; j < board_details.files; j += 1) {
                    if (ranks[i][j]) {
                        fen += ranks[i][j];
                    } else {
                        fen += "1";
                    }
                }
            } else {
                fen += "8";
            }
            if (i > 0) {
                fen += "/";
            }
        }
        
        /// Replace 1's with their number (e.g., 11 with 2).
        fen = fen.replace(/1{2,}/g, function replacer(ones)
        {
            return String(ones.length);
        });
        
        return fen;
    }
    
    function find_king(color)
    {
        var i;
        
        for (i = board.pieces.length - 1; i >= 0; i -= 1) {
            if (board.pieces[i].color === color && board.pieces[i].type === "k") {
                return board.pieces[i];
            }
        }
    }
    
    function focus_checked_king()
    {
        var king;
        if (legal_moves && legal_moves.checkers && legal_moves.checkers.length) {
            king = find_king(board.turn);
            if (king) {
                focus_square(king.file, king.rank, "red");
            }
        }
        board.checked_king = king;
    }
    
    function set_legal_moves(moves)
    {
        legal_moves = moves;
        focus_checked_king();
    }
    
    function get_legal_moves()
    {
        return legal_moves;
    }
    
    board = {
        pieces: [],
        size_board: size_board,
        theme: "default",
        mode: "setup",
        wait: wait,
        play: play,
        enable_setup: enable_setup,
        move: move,
        players: {
            w: {
                color: "w",
            },
            b: {
                color: "b",
            }
        },
        switch_turn: switch_turn,
        set_board: set_board,
        is_legal_move: is_legal_move,
        moves: [],
        get_fen: get_fen,
        board_details: board_details,
        highlight_colors: colors,
        clear_highlights: clear_highlights,
        highlight_square: highlight_square,
        set_legal_moves: set_legal_moves,
        get_legal_moves: get_legal_moves,
    /// legal_move{}
    /// onmove()
    /// onswitch()
    /// turn
    };
    
    options = options || {};
    
    create_board(el, options.dim);
    
    set_board(options.pos);
    
    window.addEventListener("mousemove", onmousemove);
    window.addEventListener("touchmove", onmousemove);
    window.addEventListener("mouseup",  onmouseup);
    window.addEventListener("touchend", onmouseup);
    window.addEventListener("keydown", onkeydown);
    window.addEventListener("keyup", onkeyup);
    
    return board;
};
