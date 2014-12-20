// ページが表示されたときToDoリストを表示する
$(function(){
  getList();
});

// フォームを送信ボタンを押すと、ToDoを追加して再表示する。
$('#form').submit(function(){
  postList();
  return false;
});
// 削除ボタンを押した時の挙動
$('#remove').click(function(){
  $.post('/remove', function(res){
    console.log(res);
  });
  return true;
});

// ToDo一覧を取得して表示する
function getList(){
  // すでに表示されている一覧を非表示にして削除する
  var $list = $('.list');
  $list.fadeOut(function(){
    $list.children().remove();
    // /todoにGETアクセスする
    $.get('tuple', function(tuples){
      // 取得したToDoを追加していく
      $.each(tuples, function(index, tuple){
        $list.append('<p>' + tuple.tupleType + ',' + tuple.tupleName + '</p>');
      });
      // 一覧を表示する
      $list.fadeIn();
    });
  });
}

// フォームに入力されたToDoを追加する
function postList(){
  // フォームに入力された値を取得
  var tupleType = $('#tupleType').val();
  var tupleName = $('#tupleName').val();

  //入力項目を空にする
  $('#tupleType').val('');
  $('#tupleName').val('');

  // /todoにPOSTアクセスする
  $.post('/tuple', {type: tupleType, name: tupleName}, function(res){
    console.log(res);
    //再度表示する
    getList();
  });
}
